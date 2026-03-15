import { test as setup, expect } from "@playwright/test";
import { config } from "dotenv";
config();

/**
 * Global setup: logs in once via the real UI and saves browser storage state.
 * All tests that need authentication reuse this state instead of
 * logging in through the UI every time.
 *
 * This uses the actual login flow (not localStorage injection) because
 * the app's version-based cache invalidation in store.ts wipes any
 * manually-set persist:* keys on page load if the version doesn't match.
 */

const TEST_EMAIL = process.env.E2E_EMAIL;
const TEST_PASSWORD = process.env.E2E_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    "E2E_EMAIL and E2E_PASSWORD environment variables must be set. " +
    "Add them to Clients/.env or export them before running tests."
  );
}
const AUTH_STATE_PATH = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // 1. Login via the real UI
  await page.goto("/login");
  await page
    .getByPlaceholder("name.surname@companyname.com")
    .fill(TEST_EMAIL);
  const passwordField = page.getByPlaceholder("Enter your password");
  await passwordField.click();
  await passwordField.fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // 2. Wait for redirect to dashboard (confirms login succeeded)
  await expect(page).toHaveURL("/", { timeout: 15_000 });

  // 3. Save storage state (localStorage + cookies) for reuse by other tests
  await page.context().storageState({ path: AUTH_STATE_PATH });

  // 4. Ensure a test project exists (needed by vendor CRUD and others)
  const API_BASE = process.env.E2E_API_URL || "http://localhost:3000";
  const res = await page.request.post(`${API_BASE}/api/projects`, {
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
