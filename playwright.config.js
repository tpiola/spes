const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    // CHROME_PATH permite rodar o teste com um Chromium do sistema (útil sem download de browsers);
    // no CI nada é definido e o Playwright usa o navegador que ele mesmo instalou.
    launchOptions: process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : process.platform === "win32"
        ? { executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" }
        : {},
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER ? undefined : {
    command: "npm run serve",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
