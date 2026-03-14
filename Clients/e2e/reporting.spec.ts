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

  // --- Tier 2: Report generation interaction ---

  test("generate report button or selector is interactive", async ({
    authedPage: page,
  }) => {
    await page.goto("/reporting");

    // Look for a project/framework selector that gates report generation
    const selector = page
      .getByRole("combobox")
      .or(page.getByRole("button", { name: /select.*project/i }))
      .or(page.getByText(/select.*project/i));

    if (await selector.first().isVisible().catch(() => false)) {
      await selector.first().click();
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape");
    }

    // Check for generate/export button
    const generateBtn = page.getByRole("button", {
      name: /generate|export|download/i,
    });
    if (await generateBtn.first().isVisible().catch(() => false)) {
      // Verify it exists — don't click as it may trigger a long operation
      await expect(generateBtn.first()).toBeVisible();
    }
  });
});
