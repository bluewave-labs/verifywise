import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Tasks", () => {
  test("renders the tasks page", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/tasks/);

    // Page should show task-related content or empty state
    await expect(
      page.getByText(/task/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/tasks");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("task list or empty state is visible", async ({
    authedPage: page,
  }) => {
    await page.goto("/tasks");

    const content = page
      .getByRole("table")
      .or(page.getByRole("grid"))
      .or(page.getByText(/no.*task/i))
      .or(page.getByRole("button", { name: /add|new|create/i }));
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });
});
