const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const posts = JSON.parse(fs.readFileSync(path.join(root, "content", "posts.json"), "utf8"));
const SITE = "https://spes.blog";
const WHATSAPP = "https://chat.whatsapp.com/HhX3hsFYl6v9ylOySJjX8F";
const FACEBOOK = "https://www.facebook.com/profile.php?id=100070770821519";
const labels = { oracao: "Orações", santo: "Santos", formacao: "Formação" };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const header = relative => `
<a class="skip" href="#conteudo">Ir para o conteúdo</a>
<header class="site-header"><div class="shell nav">
  <a class="brand" href="${relative}"><img src="${relative}assets/spes-logo-facebook.webp" width="640" height="640" alt=""><strong>SPES</strong></a>
  <nav class="nav-links" aria-label="Navegação principal">
    <a href="${relative}conteudos/">Conteúdos</a><a href="${relative}oracoes/">Orações</a><a href="${relative}santos/">Santos</a>
    <a class="nav-cta" data-track="whatsapp_group_click" data-placement="editorial-nav" href="${WHATSAPP}">Rezar conosco</a>
  </nav>
</div></header>`;

const footer = relative => `
<footer class="footer"><div class="shell footer-grid"><div>
  <a class="brand" href="${relative}"><img src="${relative}assets/spes-logo-facebook.webp" width="640" height="640" alt=""><strong>SPES</strong></a>
  <p>Esperança que se transforma em oração. Comunidade católica independente, gratuita e sem pedidos de dinheiro.</p>
</div><div><a href="${relative}politica-editorial">Política editorial</a><br><a href="${relative}privacidade">Privacidade e LGPD</a><br><a href="${FACEBOOK}" rel="noopener noreferrer">Facebook oficial</a></div></div></footer>
<a class="button floating" data-track="whatsapp_group_click" data-placement="floating" href="${WHATSAPP}">Rezar conosco no WhatsApp</a>
<script defer src="/_vercel/insights/script.js"></script><script defer src="${relative}assets/site.js"></script>`;

const card = (post, relative) => `<a class="card" data-type="${post.type}" href="${relative}conteudos/${post.slug}">
  <img src="${relative}assets/${post.image}" width="768" height="520" alt="${escape(post.imageAlt)}" loading="lazy">
  <div class="card-copy"><small>${labels[post.type]}</small><h3>${escape(post.title)}</h3><p>${escape(post.description)}</p></div>
</a>`;

for (const post of posts) {
  const related = posts.filter(item => item.slug !== post.slug).sort((a, b) => Number(b.type === post.type) - Number(a.type === post.type)).slice(0, 3);
  const url = `${SITE}/conteudos/${post.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        image: `${SITE}/assets/${post.image}`,
        datePublished: post.datePublished,
        dateModified: post.datePublished,
        inLanguage: "pt-BR",
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Equipe editorial SPES", url: `${SITE}/politica-editorial` },
        publisher: { "@type": "Organization", name: "SPES", logo: { "@type": "ImageObject", url: `${SITE}/assets/spes-logo-facebook.webp` } },
        keywords: [post.keyword, "oração católica", "esperança cristã"]
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Conteúdos", item: `${SITE}/conteudos/` },
          { "@type": "ListItem", position: 3, name: post.title, item: url }
        ]
      }
    ]
  };
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${url}`)}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const html = `<!DOCTYPE html><html lang="pt-BR"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(post.title)} | SPES</title><meta name="description" content="${escape(post.description)}">
  <meta name="author" content="Equipe editorial SPES"><meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${url}"><link rel="stylesheet" href="../../assets/editorial.css">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600;6..96,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <meta property="og:locale" content="pt_BR"><meta property="og:type" content="article"><meta property="og:site_name" content="SPES">
  <meta property="og:title" content="${escape(post.title)}"><meta property="og:description" content="${escape(post.description)}">
  <meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/${post.image}"><meta property="og:image:alt" content="${escape(post.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(post.title)}"><meta name="twitter:description" content="${escape(post.description)}"><meta name="twitter:image" content="${SITE}/assets/${post.image}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body>${header("../../")}
<main id="conteudo" data-article>
  <section class="article-hero"><img src="../../assets/${post.image}" width="1792" height="1024" alt="${escape(post.imageAlt)}">
    <div class="shell hero-copy"><div class="eyebrow">${escape(post.eyebrow)}</div><h1>${escape(post.title)}</h1><p class="dek">${escape(post.description)}</p><div class="meta"><span>${post.readingTime}</span><span>Publicado em 25 de julho de 2026</span><span>Revisão editorial SPES</span></div></div>
  </section>
  <div class="shell article-layout"><article class="article-body">
    <blockquote class="scripture">${escape(post.scripture)}</blockquote>
    ${post.body.map(paragraph => `<p>${escape(paragraph)}</p>`).join("")}
    <div class="practice"><strong>Um passo para hoje</strong>${escape(post.practice)}</div>
    <section class="share" aria-label="Compartilhar este conteúdo">
      <button type="button" data-share>Compartilhar</button><a data-track="content_share_whatsapp" href="${whatsappShare}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a data-track="content_share_facebook" href="${facebookShare}" target="_blank" rel="noopener noreferrer">Facebook</a><button type="button" data-copy>Copiar link</button><p class="share-status" role="status" aria-live="polite"></p>
    </section>
  </article><aside class="aside-card"><h2>Reze acompanhado</h2><p>Receba o próximo roteiro e caminhe com uma comunidade gratuita, moderada e sem pedidos de dinheiro.</p><a class="button" data-track="whatsapp_group_click" data-placement="article-aside" href="${WHATSAPP}">Entrar no grupo</a></aside></div>
  <section class="related"><div class="shell"><h2>Continue neste caminho</h2><div class="cards">${related.map(item => card(item, "../../")).join("")}</div></div></section>
</main>${footer("../../")}</body></html>`;
  const destination = path.join(root, "conteudos", post.slug);
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, "index.html"), html);
}

const archive = (title, description, filter) => {
  const selected = filter ? posts.filter(post => post.type === filter) : posts;
  const canonical = filter ? `${SITE}/${filter === "oracao" ? "oracoes" : "santos"}/` : `${SITE}/conteudos/`;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | SPES</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="../assets/editorial.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600;6..96,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${SITE}/assets/spes-facebook-cover.webp"></head><body>${header("../")}<main id="conteudo"><section class="archive-hero"><div class="shell"><div class="eyebrow">Biblioteca SPES</div><h1 class="archive-title">${title}</h1><p>${description}</p></div></section><section class="archive"><div class="shell">${filter ? "" : `<div class="filter"><button type="button" aria-pressed="true" data-filter="todos">Todos</button><button type="button" aria-pressed="false" data-filter="oracao">Orações</button><button type="button" aria-pressed="false" data-filter="santo">Santos</button><button type="button" aria-pressed="false" data-filter="formacao">Formação</button></div>`}<div class="cards">${selected.map(post => card(post, "../")).join("")}</div></div></section></main>${footer("../")}</body></html>`;
};

for (const [folder, title, description, filter] of [
  ["conteudos", "Conteúdos para rezar, conhecer e permanecer", "Orações, vida dos santos e formação católica para acompanhar seu caminho com serenidade e constância.", null],
  ["oracoes", "Orações para cada momento do dia", "Orações católicas originais para a manhã, a noite, a família e os momentos em que a esperança precisa de cuidado.", "oracao"],
  ["santos", "Santos que iluminam a vida cotidiana", "História, virtude e uma prática concreta inspirada nos santos da Igreja.", "santo"]
]) {
  const destination = path.join(root, folder);
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, "index.html"), archive(title, description, filter));
}

const urls = [
  `${SITE}/`, `${SITE}/conteudos/`, `${SITE}/oracoes/`, `${SITE}/santos/`,
  `${SITE}/politica-editorial`, `${SITE}/privacidade`,
  ...posts.map(post => `${SITE}/conteudos/${post.slug}`)
];
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url, index) => `  <url><loc>${url}</loc><lastmod>2026-07-25</lastmod><changefreq>${index === 0 ? "daily" : "weekly"}</changefreq><priority>${index === 0 ? "1.0" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`);
console.log(`Generated ${posts.length} articles, 3 archives and ${urls.length} sitemap URLs.`);
