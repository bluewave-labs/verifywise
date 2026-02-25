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
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
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
});
