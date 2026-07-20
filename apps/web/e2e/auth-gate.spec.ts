import { test, expect } from "@playwright/test";

// Regression coverage for WEB-AUTH-GATE-1 — /auth used to render the full
// sign-in form for a visitor who was already signed in.
test.describe("auth gate (signed in)", () => {
  test("redirects an already-signed-in visitor away from /auth", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveURL("/");
  });

  test("mode=password reaches the dedicated set-password form instead of redirecting", async ({ page }) => {
    await page.goto("/auth?mode=password");
    await expect(page).toHaveURL(/\/auth\?mode=password/);
    await expect(page.getByRole("heading", { name: "Set a password." })).toBeVisible();
  });

  test("SET PASSWORD is reachable from the account menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Your account" }).click();
    await page.getByRole("menuitem", { name: "SET PASSWORD" }).click();
    await expect(page).toHaveURL(/\/auth\?mode=password/);
  });
});
