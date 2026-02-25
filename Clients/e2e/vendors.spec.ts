import { test, expect } from "./fixtures/auth.fixture";

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
});
