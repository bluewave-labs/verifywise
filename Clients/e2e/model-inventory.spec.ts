import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Model Inventory", () => {
  test("renders the model inventory page", async ({ authedPage: page }) => {
    await page.goto("/model-inventory");
    await expect(page).toHaveURL(/\/model-inventory/);

    // Page should show model-related content or empty state
    await expect(
      page.getByText(/model/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/model-inventory");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("table or empty state is visible", async ({ authedPage: page }) => {
    await page.goto("/model-inventory");

    // Either a table with models or an empty state
    const content = page
      .getByRole("table")
      .or(page.getByRole("grid"))
      .or(page.getByText(/no.*model/i))
      .or(page.getByText(/add.*model/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
