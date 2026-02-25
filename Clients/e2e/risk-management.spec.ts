import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Risk Management", () => {
  test("renders the risk management page", async ({ authedPage: page }) => {
    await page.goto("/risk-management");
    await expect(page).toHaveURL(/\/risk-management/);

    // Page should show risk-related content or empty state
    await expect(
      page.getByText(/risk/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/risk-management");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("tabs are visible on the page", async ({ authedPage: page }) => {
    await page.goto("/risk-management");

    // Look for tab elements (risks often have categorized tabs)
    const tab = page
      .getByRole("tab")
      .or(page.getByRole("tablist"));
    await expect(tab.first()).toBeVisible({ timeout: 10_000 });
  });
});
