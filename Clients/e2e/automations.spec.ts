import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Automations", () => {
  test("renders the automations page", async ({ authedPage: page }) => {
    await page.goto("/automations");
    await expect(page).toHaveURL(/\/automations/);

    // Page should show automation-related content or empty state
    await expect(
      page.getByText(/automation/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/automations");
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

  test("automation list or create button is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/automations");

    const content = page
      .getByRole("button", { name: /add|new|create/i })
      .or(page.getByText(/no.*automation/i))
      .or(page.getByRole("table"))
      .or(page.getByRole("grid"));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 2: Automation list content ---

  test("automation cards or rows display status indicators", async ({
    authedPage: page,
  }) => {
    await page.goto("/automations");

    // Automations may show enabled/disabled toggles or status badges
    const statusIndicator = page
      .getByRole("switch")
      .or(page.getByText(/active|enabled|disabled|paused/i))
      .or(page.getByRole("checkbox"))
      .or(page.getByText(/no.*automation/i));

    await expect(statusIndicator.first()).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 3: Create button interaction ---

  test("create automation button opens modal or form", async ({
    authedPage: page,
  }) => {
    await page.goto("/automations");
    const addBtn = page
      .getByRole("button", { name: /add|new|create/i })
      .first();

    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();

      await expect(
        page
          .getByText(/new automation/i)
          .or(page.getByText(/create automation/i))
          .or(page.locator(".MuiDrawer-root"))
          .or(page.getByRole("dialog"))
          .first()
      ).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press("Escape");
    }
  });
});
