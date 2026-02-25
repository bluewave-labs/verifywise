import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("AI Detection", () => {
  test("renders the AI detection scan page", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-detection/scan");
    await expect(page).toHaveURL(/\/ai-detection/);

    // Page should show AI detection content
    await expect(
      page
        .getByText(/ai detection/i)
        .or(page.getByText(/scan/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/ai-detection/scan");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("scan UI elements are visible", async ({ authedPage: page }) => {
    await page.goto("/ai-detection/scan");

    const content = page
      .getByRole("button", { name: /scan|start|new/i })
      .or(page.getByRole("textbox"))
      .or(page.getByText(/repository/i))
      .or(page.getByText(/no.*scan/i));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
