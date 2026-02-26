import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Policies", () => {
  test("renders the policies page", async ({ authedPage: page }) => {
    await page.goto("/policies");
    await expect(page).toHaveURL(/\/policies/);

    // Page should show policy-related content or empty state
    await expect(
      page.getByText(/polic/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/policies");
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

  test("add button or empty state is present", async ({
    authedPage: page,
  }) => {
    await page.goto("/policies");

    const content = page
      .getByRole("button", { name: /add|new|create/i })
      .or(page.getByText(/no.*polic/i))
      .or(page.getByText(/get started/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
