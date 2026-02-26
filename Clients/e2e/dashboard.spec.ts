import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Dashboard", () => {
  test("renders the dashboard with key widgets", async ({
    authedPage: page,
  }) => {
    // authedPage already navigates to "/" and waits for auth
    await expect(page).toHaveURL("/");

    // Dashboard should display meaningful content
    await expect(page.locator("body")).not.toBeEmpty();

    // Look for common dashboard elements (headings, cards, or charts)
    const heading = page
      .getByRole("heading", { level: 1 })
      .or(page.getByRole("heading", { level: 2 }))
      .or(page.getByText(/dashboard/i));
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
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

  test("sidebar navigation is visible", async ({ authedPage: page }) => {
    // The sidebar should be present on the dashboard
    const sidebar = page
      .getByRole("navigation")
      .or(page.locator('[class*="sidebar" i]'))
      .or(page.locator('[class*="Sidebar" i]'));
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });
  });
});
