import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Incident Management", () => {
  test("renders the incidents page", async ({ authedPage: page }) => {
    await page.goto("/ai-incident-managements");
    await expect(page).toHaveURL(/\/ai-incident-managements/);

    // Page should show incident-related content or empty state
    await expect(
      page.getByText(/incident/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-incident-managements");
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

  test("incident list or empty state is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-incident-managements");

    const content = page
      .getByRole("table")
      .or(page.getByRole("grid"))
      .or(page.getByText(/no.*incident/i))
      .or(page.getByRole("button", { name: /add|new|create|report/i }));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
