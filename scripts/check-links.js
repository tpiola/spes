const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
const failures = [];

for (const reference of references) {
  if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
  if (reference.startsWith("/_vercel/")) continue;
  if (reference.startsWith("#")) {
    if (!ids.has(reference.slice(1))) failures.push(`Âncora ausente: ${reference}`);
    continue;
  }

  const [pathname, hash] = reference.split("#");
  const target = path.join(root, pathname.replace(/^\//, ""));
  if (!fs.existsSync(target)) failures.push(`Arquivo ausente: ${pathname}`);
  if (hash && pathname.endsWith(".html")) {
    const targetHtml = fs.readFileSync(target, "utf8");
    if (!new RegExp(`\\bid="${hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(targetHtml)) {
      failures.push(`Âncora ausente: ${reference}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`${references.length} referências internas e locais verificadas.`);
