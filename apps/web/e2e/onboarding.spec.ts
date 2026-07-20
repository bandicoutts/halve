import { test, expect } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.join(__dirname, "..", ".env.local") });

// Exercises OnboardingScreen's own gate directly (see src/app/onboarding/page.tsx):
// shown when the profile has no display_name, redirects away once it does.
// Uses a dev-only reset endpoint (mirrors /api/dev-login's safety gates)
// rather than a full magic-link browser flow for a throwaway user — see
// docs/DECISIONS.md WEB-E2E-1 for why.
test.describe("onboarding", () => {
  test.beforeEach(async ({ request }) => {
    const secret = process.env.DEV_LOGIN_SECRET;
    const res = await request.post(`/api/dev-reset-onboarding?secret=${secret}`);
    if (!res.ok()) throw new Error(`dev-reset-onboarding failed: ${res.status()} ${await res.text()}`);
  });

  test("an unnamed profile sees the onboarding form; saving a name redirects home", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();

    await page.getByLabel("Display name").fill("E2E Test Runner");
    await page.getByRole("button", { name: "Save name" }).click();
    await expect(page).toHaveURL("/");

    // The gate now redirects away, since a name is set again — also leaves
    // the shared test account in a valid state for every other test.
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/");
  });

  test("SKIP FOR NOW leaves the profile unnamed and continues anyway", async ({ page }) => {
    await page.goto("/onboarding?next=%2Fstats");
    await page.getByRole("button", { name: "SKIP FOR NOW" }).click();
    await expect(page).toHaveURL(/\/stats$/);

    // Unnamed accounts should still reach onboarding again next time.
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();

    // Restore a name so later tests (and manual preview use) see a normal,
    // named account again.
    await page.getByLabel("Display name").fill("E2E Test Runner");
    await page.getByRole("button", { name: "Save name" }).click();
    await expect(page).toHaveURL("/");
  });
});
