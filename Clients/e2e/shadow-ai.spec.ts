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
