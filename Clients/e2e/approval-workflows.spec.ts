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

  // --- Tier 2: Workflow list content ---

  test("workflow items show status or stage information", async ({
    authedPage: page,
  }) => {
    await page.goto("/approval-workflows");

    // Workflows should display status info or empty state message
    const statusContent = page
      .getByText(/pending|approved|rejected|active|draft/i)
      .or(page.getByText(/no.*workflow/i))
      .or(page.getByText(/get started/i))
      .or(page.getByRole("table"));
    await expect(statusContent.first()).toBeVisible({ timeout: 10_000 });
  });

  // --- Tier 3: Create workflow interaction ---

  test("create workflow button opens modal or form", async ({
    authedPage: page,
  }) => {
    await page.goto("/approval-workflows");
    const addBtn = page
      .getByRole("button", { name: /add|new|create/i })
      .first();

    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();

      await expect(
        page
          .getByText(/new workflow/i)
          .or(page.getByText(/create workflow/i))
          .or(page.locator(".MuiDrawer-root"))
          .or(page.getByRole("dialog"))
          .first()
      ).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press("Escape");
    }
  });
});
