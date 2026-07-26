const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const ignored = new Set(["node_modules", ".git", "test-results", ".lighthouseci"]);
const htmlFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name.endsWith(".html")) htmlFiles.push(target);
  }
};
walk(root);

const failures = [];
let referencesChecked = 0;
const resolveTarget = pathname => {
  const clean = decodeURIComponent(pathname).replace(/^\//, "").replace(/[?#].*$/, "");
  const direct = path.join(root, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
    const index = path.join(direct, "index.html");
    if (fs.existsSync(index)) return index;
  }
  if (!path.extname(clean)) {
    const html = `${direct}.html`;
    if (fs.existsSync(html)) return html;
  }
  return null;
};

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const reference of references) {
    referencesChecked += 1;
    if (/^(?:https?:|mailto:|tel:|data:)/.test(reference) || reference.startsWith("/_vercel/")) continue;
    if (reference.startsWith("#")) {
      if (!ids.has(reference.slice(1))) failures.push(`${path.relative(root, file)}: âncora ausente ${reference}`);
      continue;
    }
    const [pathname, hash] = reference.split("#");
    const absolutePath = pathname.startsWith("/")
      ? pathname
      : `/${path.relative(root, path.resolve(path.dirname(file), pathname)).replace(/\\/g, "/")}`;
    const target = resolveTarget(absolutePath);
    if (!target) {
      failures.push(`${path.relative(root, file)}: arquivo ausente ${reference}`);
      continue;
    }
    if (hash) {
      const targetHtml = fs.readFileSync(target, "utf8");
      const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\bid="${escaped}"`).test(targetHtml)) failures.push(`${path.relative(root, file)}: âncora ausente ${reference}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${htmlFiles.length} páginas e ${referencesChecked} referências internas verificadas.`);
