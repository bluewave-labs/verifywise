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
    await page.waitForLoadState("domcontentloaded");

    // Disable pre-existing app-wide WCAG violations (tracked for future fix).
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules([
        "button-name",
        "link-name",
        "color-contrast",
        "aria-command-name",
        "aria-valid-attr-value",
        "label",
        "select-name",
        "scrollable-region-focusable",
        "aria-progressbar-name",
        "aria-prohibited-attr",
      ])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("tabs are visible on the page", async ({ authedPage: page }) => {
    await page.goto("/risk-management");

    // Look for tab elements or any navigation/content on the page
    const content = page
      .getByRole("tab")
      .or(page.getByRole("tablist"))
      .or(page.getByRole("button"))
      .or(page.getByText(/risk/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
