import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home loads and shows today's puzzle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /today.?s\s*puzzle/i })).toBeVisible();
  });

  test("primary nav reaches Practice, Archive, and Stats", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Practice" }).click();
    await expect(page).toHaveURL(/\/practice$/);

    await page.getByRole("link", { name: "Archive" }).click();
    await expect(page).toHaveURL(/\/archive$/);
    // "The back<br/>catalogue." spans a <br/>, so match a substring rather
    // than the full string (the <br/> breaks an exact-text match).
    await expect(page.getByText(/catalogue/i)).toBeVisible();

    await page.getByRole("link", { name: "Stats" }).click();
    await expect(page).toHaveURL(/\/stats$/);
  });
});
