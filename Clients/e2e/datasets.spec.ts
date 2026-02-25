import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Datasets", () => {
  test("renders the datasets page", async ({ authedPage: page }) => {
    await page.goto("/datasets");
    await expect(page).toHaveURL(/\/datasets/);

    // Page should show dataset-related content or empty state
    await expect(
      page.getByText(/dataset/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/datasets");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dataset list or empty state is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/datasets");

    const content = page
      .getByRole("table")
      .or(page.getByRole("grid"))
      .or(page.getByText(/no.*dataset/i))
      .or(page.getByRole("button", { name: /add|new|create/i }));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
