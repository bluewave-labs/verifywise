import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("AI Trust Center", () => {
  test("renders the AI trust center page", async ({ authedPage: page }) => {
    await page.goto("/ai-trust-center");
    await expect(page).toHaveURL(/\/ai-trust-center/);

    // Page should show trust center content
    await expect(
      page
        .getByText(/trust/i)
        .or(page.getByText(/ai trust/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-trust-center");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("trust center content sections are visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-trust-center");

    const content = page
      .getByRole("tab")
      .or(page.getByRole("heading"))
      .or(page.getByText(/compliance/i))
      .or(page.getByText(/governance/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
