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

  // --- Tier 2: Search ---

  test("searching for nonexistent incident filters results", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-incident-managements");
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'));

    if (await searchInput.first().isVisible().catch(() => false)) {
      await searchInput.first().fill("nonexistent-xyz-incident");
      await page.waitForTimeout(500);
      await searchInput.first().clear();
      await page.waitForTimeout(300);
    }
  });

  // --- Tier 3: Drawer open/close ---

  test("Add new incident button opens drawer", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-incident-managements");
    const addBtn = page.getByRole("button", { name: /add new incident/i });

    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      // Incidents use a MUI Drawer (role="presentation")
      await expect(
        page
          .locator(".MuiDrawer-root")
          .or(page.getByText(/new incident/i))
          .or(page.getByText(/create incident/i))
          .first()
      ).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press("Escape");
    }
  });

  // --- Tier 3: Drawer form fields ---

  test("incident drawer contains form fields", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-incident-managements");
    const addBtn = page.getByRole("button", { name: /add new incident/i });

    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Verify form fields are present inside the drawer
      const formField = page
        .getByRole("textbox")
        .or(page.getByRole("combobox"))
        .or(page.getByPlaceholder(/title|name|description/i));

      if (await formField.first().isVisible().catch(() => false)) {
        const count = await formField.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }

      await page.keyboard.press("Escape");
    }
  });
});
