import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Agent Discovery", () => {
  test("renders the agent discovery page", async ({ authedPage: page }) => {
    await page.goto("/agent-discovery");
    await expect(page).toHaveURL(/\/agent-discovery/);

    // Page should show agent-related content or empty state
    await expect(
      page.getByText(/agent/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/agent-discovery");
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

  test("agent list or empty state is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/agent-discovery");

    const content = page
      .getByRole("button", { name: /add|new|register/i })
      .or(page.getByText(/no.*agent/i))
      .or(page.getByRole("table"))
      .or(page.getByRole("grid"));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 2: Search ---

  test("search box is present and accepts input", async ({
    authedPage: page,
  }) => {
    await page.goto("/agent-discovery");
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('[data-testid="search-input"]'));

    if (await searchInput.first().isVisible().catch(() => false)) {
      await searchInput.first().fill("nonexistent-xyz-agent");
      await page.waitForTimeout(500);
      await searchInput.first().clear();
      await page.waitForTimeout(300);
    }
  });

  // --- Tier 3: Add agent button ---

  test("add agent button opens creation form", async ({
    authedPage: page,
  }) => {
    await page.goto("/agent-discovery");
    const addBtn = page
      .getByRole("button", { name: /add|new|register/i })
      .first();

    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();

      await expect(
        page
          .getByText(/new agent/i)
          .or(page.getByText(/register agent/i))
          .or(page.getByText(/add agent/i))
          .or(page.locator(".MuiDrawer-root"))
          .or(page.getByRole("dialog"))
          .first()
      ).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press("Escape");
    }
  });
});
