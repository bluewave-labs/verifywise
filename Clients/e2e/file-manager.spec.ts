import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("File Manager", () => {
  test("renders the file manager page", async ({ authedPage: page }) => {
    await page.goto("/file-manager");
    await expect(page).toHaveURL(/\/file-manager/);

    // Page should show file-related content or empty state
    await expect(
      page.getByText(/file/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/file-manager");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("upload area or file list is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/file-manager");

    const content = page
      .getByRole("button", { name: /upload|add/i })
      .or(page.getByText(/drag.*drop/i))
      .or(page.getByRole("table"))
      .or(page.getByText(/no.*file/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
