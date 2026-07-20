import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * E2E suite for the flows most prone to "the server knows something the page
 * doesn't check" bugs (see docs/DECISIONS.md WEB-BOARD-REVIEW-1, WEB-AUTH-GATE-1).
 * Runs against a real dev server + real Supabase project (the same one `pnpm dev`
 * already points at), authenticated via the dev-only /api/dev-login route.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shared test account + shared daily puzzle row — avoid solve-state races
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    storageState: path.join(__dirname, "e2e/.auth/storage-state.json"),
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
