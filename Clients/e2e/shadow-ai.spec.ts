import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Shadow AI", () => {
  test("renders the shadow AI insights page", async ({
    authedPage: page,
  }) => {
    await page.goto("/shadow-ai/insights");
    await expect(page).toHaveURL(/\/shadow-ai/);

    // Page should show shadow AI content
    await expect(
      page
        .getByText(/shadow/i)
        .or(page.getByText(/insight/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/shadow-ai/insights");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dashboard metrics or empty state is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/shadow-ai/insights");

    const content = page
      .getByText(/tool/i)
      .or(page.getByText(/user/i))
      .or(page.getByText(/no.*data/i))
      .or(page.getByText(/get started/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
