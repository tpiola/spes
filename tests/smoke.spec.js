const { test, expect } = require("@playwright/test");

test("renders the complete conversion journey without browser errors", async ({ page }) => {
  const errors = [];
  await page.route("**/_vercel/insights/script.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", error => errors.push(error.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/SPES/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("40 dias");
  await expect(page.getByRole("heading", { name: /A constância mantém essa luz viva/ })).toBeVisible();
  await expect(page.getByText("São Carlo Acutis", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nunca pediremos dinheiro" })).toBeVisible();
  await expect(page.locator("#newsletter-form")).toBeVisible();
  expect(await page.locator("a.js-whatsapp").count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator("a.js-whatsapp").first()).toHaveAttribute(
    "href",
    /^https:\/\/chat\.whatsapp\.com\//
  );
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
  await expect(page.locator("#menu-mobile")).toBeVisible();
  await page.getByRole("button", { name: "Fechar menu" }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});
