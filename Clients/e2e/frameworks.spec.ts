import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Frameworks", () => {
  test("renders the frameworks page", async ({ authedPage: page }) => {
    await page.goto("/framework");
    await expect(page).toHaveURL(/\/framework/);

    // Page should show framework-related content
    await expect(
      page.getByText(/framework/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/framework");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("framework list or selection is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/framework");

    const content = page
      .getByText(/eu ai act/i)
      .or(page.getByText(/iso/i))
      .or(page.getByText(/nist/i))
      .or(page.getByRole("button", { name: /add|select/i }));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
