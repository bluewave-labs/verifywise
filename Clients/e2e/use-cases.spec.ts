import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";

test.describe("Use Cases / Projects", () => {
  test("renders the use cases overview page", async ({
    authedPage: page,
  }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL(/\/overview/);

    // Page should show use-case/project content or empty state
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(
      page
        .getByText(/use case/i)
        .or(page.getByText(/project/i))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page has no accessibility violations", async ({
    authedPage: page,
  }) => {
    await page.goto("/overview");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("add button or empty state is present", async ({
    authedPage: page,
  }) => {
    await page.goto("/overview");

    // Either an "Add" / "New" / "Create" button or an empty-state message
    const addButton = page
      .getByRole("button", { name: /add|new|create/i })
      .or(page.getByText(/no.*use case/i))
      .or(page.getByText(/no.*project/i))
      .or(page.getByText(/get started/i));
    await expect(addButton.first()).toBeVisible({ timeout: 10_000 });
  });
});
