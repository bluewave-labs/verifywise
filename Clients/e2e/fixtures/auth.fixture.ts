import { test as base, expect, type Page } from "@playwright/test";

/**
 * Extended test fixture that provides an already-authenticated page.
 *
 * Authentication state is injected via Playwright's storageState in
 * playwright.config.ts (set by e2e/global.setup.ts). The `authedPage`
 * fixture simply verifies the page is authenticated and ready to use.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/auth.fixture";
 *   test("my test", async ({ authedPage }) => { ... });
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    // storageState is already loaded by Playwright config.
    // Navigate to the dashboard to trigger Redux rehydration.
    await page.goto("/");

    // Wait for the page to finish loading (not stuck on /login)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    await use(page);
  },
});

export { expect };
