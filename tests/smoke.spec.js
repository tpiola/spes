const { test, expect } = require("@playwright/test");

/** Todas as views do santuário (o mesmo array está no JS do site). */
const VIEWS = ["santuario", "carlo", "fotos", "eucaristia", "oracao", "midia"];

async function percorrer(page) {
  await page.evaluate(async () => {
    const altura = document.body.scrollHeight;
    for (let y = 0; y < altura; y += 500) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
}

test("renders the digital sanctuary without browser errors", async ({ page }) => {
  test.setTimeout(180_000); // percorre as 15 views checando as imagens de cada uma
  const errors = [];
  const externos = [];
  await page.route("**/api/santo-do-dia", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));
  // o santuário não pede nada a terceiros: tudo é servido pelo próprio domínio
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4173")) externos.push(request.url());
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Carlo Acutis/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("autoestrada para o céu");
  await expect(page.getByRole("heading", { name: "Cinco portas para chegar até ele." })).toBeVisible();
  expect(await page.locator('a[href*="chat.whatsapp.com"]').count()).toBeGreaterThanOrEqual(3);
  // o emblema do santuário é a Madonna della Seggiola, de Rafael: o favicon mudou junto
  await expect(page.locator('link[rel="icon"][href*="favicon-32"]')).toHaveCount(1);
  await expect(page.locator('.brand-mark').first()).toHaveAttribute("src", /logo-nossa-senhora/);
  await expect(page.locator('a[href*="chat.whatsapp.com"]').first()).toHaveAttribute(
    "href",
    /^https:\/\/chat\.whatsapp\.com\//
  );

  // Regra do santuário: só imagens de São Carlo Acutis. O `.hero-media` é arte de
  // fundo e não entra na lista de <img>; as imagens do acervo vêm do pacote oficial.
  const entrar = page.locator('.hero .primary[data-view="carlo"]');
  await expect(entrar).toBeVisible();
  await entrar.click();
  await expect(page.locator("#view-carlo h2").first()).toContainText("autoestrada para o céu");
  const fontes = await page.locator("main img").evaluateAll(images =>
    images.map(image => image.getAttribute("src"))
  );
  expect(fontes.length).toBeGreaterThanOrEqual(60);
  // As imagens de CONTEÚDO são só de São Carlo Acutis. A exceção declarada é o emblema do
  // santuário — a «Madonna della Seggiola» de Rafael, domínio público — que aparece no
  // medalhão do dossiê e nos ícones. Procedência em content/creditos-imagens.md.
  expect(fontes.every(src => /\/carlo-|\/logo-nossa-senhora/.test(src))).toBe(true);

  // Cada view: percorre e confere que nenhuma imagem ficou quebrada.
  // (As imagens são loading="lazy" e as views inativas não carregam nada —
  // por isso a checagem é feita com a view aberta, e não no documento todo.)
  for (const view of VIEWS) {
    // o menu lateral funciona nos dois tamanhos; o menu do topo fica oculto no celular
    await page.locator(`.rail button[data-view="${view}"]`).click();
    await percorrer(page);
    const quebradas = await page
      .locator(`#view-${view} img:not(#lightbox-obra img)`)
      .evaluateAll(images =>
        images.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute("src"))
      );
    expect(quebradas, `imagens quebradas em #view-${view}`).toEqual([]);
  }
  // o acervo tem as 60 fotografias e o dossiê dele tem a estátua, as relíquias e a faixa de retratos
  expect(await page.locator("#view-fotos img:not(#lightbox-obra img)").count()).toBe(60);
  expect(await page.locator("#view-carlo img").count()).toBeGreaterThanOrEqual(10);

  // A contemplação virou texto: não há mais lightbox de terceiros nem imagem externa.
  await page.locator('.rail button[data-view="midia"]').click();
  await expect(page.getByRole("heading", { name: "De onde vem cada palavra deste site." })).toBeVisible();
  expect(await page.locator("#media-dialog").count()).toBe(0);
  expect(await page.locator(".media-stage img").count()).toBe(0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("footer")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth)
  );
  expect(externos).toEqual([]);
  expect(errors).toEqual([]);
});

test("o acervo abre a fotografia em tamanho grande, navega e volta o foco", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.locator('.rail button[data-view="fotos"]').click();
  const grade = page.locator("#fotos-grade");
  await expect(grade).toBeVisible();
  const fotos = await grade.locator(".foto").count();
  expect(fotos).toBe(60);

  // a busca filtra pelas legendas, sem esconder o resto do site
  await page.fill("#fotos-busca", "neve");
  await expect
    .poll(() => page.locator("#fotos-grade .foto:not(.eu-escondido)").count(), { timeout: 5_000 })
    .toBeLessThan(fotos);
  const visiveis = await page.locator("#fotos-grade .foto:not(.eu-escondido)").count();
  expect(visiveis).toBeGreaterThan(0);
  await expect(page.locator("#fotos-contador")).toContainText(`${visiveis} de 60`);
  await page.fill("#fotos-busca", "");

  const primeira = page.locator("#fotos-grade .foto").first();
  await primeira.click();
  const luz = page.locator("#lightbox-obra");
  await expect(luz).toBeVisible();
  await expect(luz.locator(".obra-contador")).toHaveText(`1 de ${fotos}`);
  await expect(luz.locator(".obra-legenda")).not.toBeEmpty();
  await page.keyboard.press("ArrowRight");
  await expect(luz.locator(".obra-contador")).toHaveText(`2 de ${fotos}`);
  await page.keyboard.press("Escape");
  await expect(luz).toBeHidden();
  await expect(primeira).toBeFocused(); // o foco volta para a foto de onde se saiu
});

test("mobile navigation opens, closes and restores focus", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile-only behavior");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#nav")).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});
