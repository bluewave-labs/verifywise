import { test as setup, expect } from "@playwright/test";

/**
 * Global setup: logs in once via the real UI and saves browser storage state.
 * All tests that need authentication reuse this state instead of
 * logging in through the UI every time.
 *
 * This uses the actual login flow (not localStorage injection) because
 * the app's version-based cache invalidation in store.ts wipes any
 * manually-set persist:* keys on page load if the version doesn't match.
 */

const TEST_EMAIL = process.env.E2E_EMAIL || "verifywise@email.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "Verifywise#1";
const AUTH_STATE_PATH = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // 1. Login via the real UI
  await page.goto("/login");
  await page
    .getByPlaceholder("name.surname@companyname.com")
    .fill(TEST_EMAIL);
  await page.getByPlaceholder("Enter your password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // 2. Wait for redirect to dashboard (confirms login succeeded)
  await expect(page).toHaveURL("/", { timeout: 15_000 });

  // 3. Save storage state (localStorage + cookies) for reuse by other tests
  await page.context().storageState({ path: AUTH_STATE_PATH });

  // 4. Ensure a test project exists (needed by vendor CRUD and others)
  const baseURL = page.url().replace(/\/+$/, "").replace(/\/[^/]*$/, "");
  const res = await page.request.post(`${baseURL}/api/projects`, {
    data: {
      project_title: "E2E Test Project",
      members: [],
      owner: 1,
      start_date: new Date().toISOString().split("T")[0],
      ai_risk_classification: "high risk",
      type_of_high_risk_role: "deployer",
      goal: "Automated E2E testing",
    },
  });
  // Ignore 400/409 if project already exists
  if (res.ok()) {
    console.log("Created E2E test project");
  } else {
    console.log(`Test project creation returned ${res.status()} (may already exist)`);
  }
});
