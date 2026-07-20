import { test, expect } from "@playwright/test";

// Regression coverage for the AccountMenu/SiteHeader consolidation — desktop's
// popover and the mobile sheet now share one SignedInMenuItems component.
test.describe("mobile nav", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu opens and shows the same signed-in account actions as desktop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();

    await expect(page.getByRole("menuitem", { name: "STATISTICS" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "SET PASSWORD" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "SIGN OUT" })).toBeVisible();

    await page.getByRole("menuitem", { name: "STATISTICS" }).click();
    await expect(page).toHaveURL(/\/stats$/);
  });
});
