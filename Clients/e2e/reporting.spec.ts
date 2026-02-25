import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Reporting", () => {
  test("renders the reporting page", async ({ authedPage: page }) => {
    await page.goto("/reporting");
    await expect(page).toHaveURL(/\/reporting/);

    // Page should show reporting-related content
    await expect(
      page.getByText(/report/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/reporting");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("report options or empty state is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/reporting");

    const content = page
      .getByRole("button", { name: /generate|create|export/i })
      .or(page.getByText(/no.*report/i))
      .or(page.getByRole("combobox"))
      .or(page.getByText(/select/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
