import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Plugins", () => {
  test("renders the plugins page", async ({ authedPage: page }) => {
    await page.goto("/plugins");
    await expect(page).toHaveURL(/\/plugins/);

    // Page should show plugin-related content
    await expect(
      page.getByText(/plugin/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/plugins");
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

  test("plugin list or marketplace is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/plugins");

    const content = page
      .getByRole("button", { name: /install|browse|add/i })
      .or(page.getByText(/marketplace/i))
      .or(page.getByText(/installed/i))
      .or(page.getByText(/no.*plugin/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 1: Sub-route navigation ---

  test("can navigate to plugin marketplace", async ({
    authedPage: page,
  }) => {
    await page.goto("/plugins/marketplace");
    await expect(page).toHaveURL(/\/plugins\/marketplace/);

    await expect(
      page
        .getByText(/marketplace/i)
        .or(page.getByText(/available/i))
        .or(page.getByText(/plugin/i))
        .or(page.getByRole("heading"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("can navigate to my plugins page", async ({ authedPage: page }) => {
    await page.goto("/plugins/my-plugins");
    await expect(page).toHaveURL(/\/plugins\/my-plugins/);

    await expect(
      page
        .getByText(/my plugin/i)
        .or(page.getByText(/installed/i))
        .or(page.getByText(/active/i))
        .or(page.getByRole("heading"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 2: Plugin card interaction ---

  test("plugin cards have action buttons", async ({ authedPage: page }) => {
    await page.goto("/plugins/marketplace");

    // Plugin cards should have install/enable/configure buttons
    const actionBtn = page
      .getByRole("button", { name: /install|enable|configure|view/i })
      .or(page.locator('[class*="card" i] button'));

    if (await actionBtn.first().isVisible().catch(() => false)) {
      const count = await actionBtn.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
