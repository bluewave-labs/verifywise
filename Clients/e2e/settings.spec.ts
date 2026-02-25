import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Settings", () => {
  test("renders the settings page", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);

    // Page should show settings-related content
    await expect(
      page.getByText(/setting/i).or(page.getByText(/organization/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("settings form or tabs are visible", async ({ authedPage: page }) => {
    await page.goto("/settings");

    const content = page
      .getByRole("tab")
      .or(page.getByRole("form"))
      .or(page.getByRole("textbox"))
      .or(page.getByText(/general/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
