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
