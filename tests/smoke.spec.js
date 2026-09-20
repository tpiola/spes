const { test, expect } = require("@playwright/test");

test("renders the digital sanctuary without browser errors", async ({ page }) => {
  const errors = [];
  const externos = [];
  await page.route("**/api/santo-do-dia", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));
  // o santuário não exibe imagem de terceiros: nada pode ser pedido fora do domínio
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4173")) externos.push(request.url());
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/SPES/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("autoestrada para o céu");
  await expect(page.locator("#daily-saint")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Um passo de cada vez." })).toBeVisible();
  expect(await page.locator('a[href*="chat.whatsapp.com"]').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('a[href*="chat.whatsapp.com"]').first()).toHaveAttribute(
    "href",
    /^https:\/\/chat\.whatsapp\.com\//
  );

  // Regra do santuário: só imagens de São Carlo Acutis, e todas carregando.
  // O `.hero-media` é arte de fundo (a estátua) e não entra na lista de <img>.
  const entrar = page.locator('.hero .primary[data-view="carlo"]');
  await expect(entrar).toBeVisible();
  await entrar.click();
  // a frase dele aparece no h1 do herói e no h2 do santuário: escopo no #view-carlo
  await expect(page.locator("#view-carlo h2").first()).toContainText("autoestrada para o céu");
  const fontes = await page.locator("main img").evaluateAll(images =>
    images.map(image => image.getAttribute("src"))
  );
  expect(fontes.length).toBeGreaterThanOrEqual(6);
  expect(fontes.every(src => src.includes("/carlo-"))).toBe(true);
  // as imagens são loading="lazy": é preciso percorrer a página para que carreguem
  await page.evaluate(async () => {
    const altura = document.body.scrollHeight;
    for (let y = 0; y < altura; y += 400) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 60));
    }
  });
  await expect
    .poll(
      () =>
        page
          .locator("main img")
          .evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)),
      { timeout: 10_000 }
    )
    .toBe(true);

  // A contemplação virou texto: não há mais lightbox nem imagem de terceiros.
  await page.locator('.rail button[data-view="midia"]').click();
  await expect(page.getByRole("heading", { name: "Imagem, silêncio e esperança." })).toBeVisible();
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
