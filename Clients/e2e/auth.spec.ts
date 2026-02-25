import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TEST_EMAIL = process.env.E2E_EMAIL || "verifywise@email.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "Verifywise#1";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Log in to your account")).toBeVisible();
    await expect(
      page.getByPlaceholder("name.surname@companyname.com")
    ).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("redirects to /login when accessing protected route without auth", async ({
    page,
  }) => {
    await page.goto("/vendors");
    await expect(page).toHaveURL(/\/login/);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByPlaceholder("name.surname@companyname.com")
      .fill(TEST_EMAIL);
    await page.getByPlaceholder("Enter your password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to the dashboard
    await expect(page).toHaveURL("/", { timeout: 15_000 });
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByPlaceholder("name.surname@companyname.com")
      .fill("bad@email.com");
    await page.getByPlaceholder("Enter your password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // An error alert should appear
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Forgot password").click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("register link navigates correctly", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Register here").click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("login page has no accessibility violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
