import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Plugins", () => {
  test("renders the plugins page", async ({ authedPage: page }) => {
    await page.goto("/plugins");
    await expect(page).toHaveURL(/\/plugins/);

    // Page should show plugin-related content
    await expect(
      page.getByText(/plugin/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/plugins");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("plugin list or marketplace is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/plugins");

    const content = page
      .getByRole("button", { name: /install|browse|add/i })
      .or(page.getByText(/marketplace/i))
      .or(page.getByText(/installed/i))
      .or(page.getByText(/no.*plugin/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
