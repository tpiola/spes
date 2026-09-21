// Servidor estático com negociação brotli/gzip e cabeçalhos iguais aos de produção.
// Existe porque o servidor anterior servia o HTML SEM compressão: o Lighthouse media
// o servidor, não o site (o mesmo portátil marca 0,85 sem compressão e 0,97 com ela).
// node:zlib já traz brotli, então não há dependência nova.
// Mirrors what Vercel does for spes.blog, so local Lighthouse numbers are comparable
// to production. node:zlib has brotli built in, so no extra deps.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = process.env.ROOT || process.cwd();
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};
// CSP igual à de produção, MENOS upgrade-insecure-requests: este servidor é HTTP,
// e essa diretiva faria o navegador pedir tudo em https — a página quebraria.
// formats that are already compressed: do not re-compress
const PRECOMPRESSED = new Set(['.webp', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.avif', '.zip', '.br', '.gz']);

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  let file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('404');
  }
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const body = fs.readFileSync(file);
  const immutable = /^\/assets\//.test(p);
  const headers = {
    'content-type': type,
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
    'etag': '"' + require('crypto').createHash('md5').update(body).digest('hex') + '"',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  };
  const ae = String(req.headers['accept-encoding'] || '');
  if (PRECOMPRESSED.has(ext) || req.method === 'HEAD') {
    headers['content-length'] = body.length;
    res.writeHead(200, headers);
    return res.end(req.method === 'HEAD' ? undefined : body);
  }
  let out = body, enc = null;
  // Production (Vercel) serves this document at 57 071 B brotli; node q11 gives
  // 46 574 B and q3 gives exactly 57 071 B. Default to q3 so the local harness
  // reproduces production byte-for-byte instead of flattering it.
  const Q = Number(process.env.BR_QUALITY || 3);
  if (/\bbr\b/.test(ae)) { out = zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: Q } }); enc = 'br'; }
  else if (/\bgzip\b/.test(ae)) { out = zlib.gzipSync(body, { level: 9 }); enc = 'gzip'; }
  if (enc) headers['content-encoding'] = enc;
  headers['vary'] = 'Accept-Encoding';
  headers['content-length'] = out.length;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : out);
});
server.listen(PORT, '127.0.0.1', () => console.log('br-serving on http://127.0.0.1:' + PORT + ' root=' + ROOT));
