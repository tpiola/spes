const { test, expect } = require("@playwright/test");

test("renders the digital sanctuary without browser errors", async ({ page }) => {
  const errors = [];
  await page.route("**/_vercel/insights/script.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );
  await page.route("**/api/santo-do-dia", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
  await page.route("https://www.google.com/maps**", route =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Mapa</title>" })
  );
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/SPES/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Quarenta dias");
  await expect(page.locator("#daily-saint")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Um passo de cada vez." })).toBeVisible();
  expect(await page.locator('a[href*="chat.whatsapp.com"]').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('a[href*="chat.whatsapp.com"]').first()).toHaveAttribute(
    "href",
    /^https:\/\/chat\.whatsapp\.com\//
  );
  expect(await page.locator('a[href*="magnific.com"]').count()).toBe(0);
  await page.locator('.rail button[data-view="midia"]').click();
  await expect(page.getByRole("heading", { name: "Imagem, silêncio e esperança." })).toBeVisible();
  await expect.poll(() => page.locator(".media-stage img").evaluateAll(images =>
    images.every(image => image.complete && image.naturalWidth > 0)
  )).toBe(true);
  await page.getByRole("button", { name: "Contemplar em tela ampla" }).click();
  await expect(page.locator("#media-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar imagem" }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("footer")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth)
  );
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
