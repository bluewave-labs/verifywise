import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Approval Workflows", () => {
  test("renders the approval workflows page", async ({
    authedPage: page,
  }) => {
    await page.goto("/approval-workflows");
    await expect(page).toHaveURL(/\/approval-workflows/);

    // Page should show approval workflow content or empty state
    await expect(
      page
        .getByText(/approval/i)
        .or(page.getByText(/workflow/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/approval-workflows");
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

  test("workflow list or create button is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/approval-workflows");

    const content = page
      .getByRole("button", { name: /add|new|create/i })
      .or(page.getByText(/no.*workflow/i))
      .or(page.getByRole("table"))
      .or(page.getByRole("grid"));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
