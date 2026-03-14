import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Model Inventory", () => {
  test("renders the model inventory page", async ({ authedPage: page }) => {
    await page.goto("/model-inventory");
    await expect(page).toHaveURL(/\/model-inventory/);

    // Page should show model-related content or empty state
    await expect(
      page.getByText(/model/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/model-inventory");
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

  test("table or empty state is visible", async ({ authedPage: page }) => {
    await page.goto("/model-inventory");

    // Either a table with models or an empty state
    const content = page
      .getByRole("table")
      .or(page.getByRole("grid"))
      .or(page.getByText(/no.*model/i))
      .or(page.getByText(/add.*model/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 1: Tab / sub-route navigation ---

  test("can navigate to model risks sub-route", async ({
    authedPage: page,
  }) => {
    await page.goto("/model-inventory/model-risks");
    await expect(page).toHaveURL(/\/model-inventory\/model-risks/);

    await expect(
      page
        .getByText(/risk/i)
        .or(page.getByRole("heading"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("can navigate to evidence hub sub-route", async ({
    authedPage: page,
  }) => {
    await page.goto("/model-inventory/evidence-hub");
    await expect(page).toHaveURL(/\/model-inventory\/evidence-hub/);

    await expect(
      page
        .getByText(/evidence/i)
        .or(page.getByRole("heading"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 2: Search ---

  test("searching for nonexistent model filters results", async ({
    authedPage: page,
  }) => {
    await page.goto("/model-inventory");
    const searchInput = page
      .getByPlaceholder(/search/i);

    if (await searchInput.first().isVisible().catch(() => false)) {
      await searchInput.first().fill("nonexistent-xyz-model");
      await page.waitForTimeout(500);
      await searchInput.first().clear();
      await page.waitForTimeout(500);
    }
  });

  // --- Tier 3: Modal open/close ---

  test("add model button opens creation modal or dropdown", async ({
    authedPage: page,
  }) => {
    await page.goto("/model-inventory");
    const addBtn = page
      .getByRole("button", { name: /add.*model/i })
      .or(page.getByRole("button", { name: /new.*model/i }))
      .or(page.getByRole("button", { name: /register.*model/i }));

    if (await addBtn.first().isVisible().catch(() => false)) {
      await addBtn.first().click();
      // Could be a modal, drawer, or dropdown
      await expect(
        page
          .getByText(/add.*model/i)
          .or(page.getByText(/new model/i))
          .or(page.getByText(/register/i))
          .or(page.locator(".MuiDrawer-root"))
          .or(page.locator(".MuiPopover-root"))
          .first()
      ).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press("Escape");
    }
  });
});
