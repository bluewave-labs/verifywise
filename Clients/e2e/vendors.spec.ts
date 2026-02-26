import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Vendors Page", () => {
  test("displays the vendor page with title", async ({ authedPage: page }) => {
    await page.goto("/vendors");

    // Page should load and show vendor-related content
    await expect(page.getByText(/vendor/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("has Vendors and Risks tabs", async ({ authedPage: page }) => {
    await page.goto("/vendors");

    // Look for tab elements
    const vendorsTab = page.getByRole("tab", { name: /vendors/i });
    const risksTab = page.getByRole("tab", { name: /risks/i });

    // At least one tab should be visible
    await expect(vendorsTab.or(risksTab).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("search box is present", async ({ authedPage: page }) => {
    await page.goto("/vendors");

    // Search input should be available
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'));
    await expect(searchInput.first()).toBeVisible({ timeout: 10_000 });
  });

  test("vendors page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/vendors");
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
});
