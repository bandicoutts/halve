import { test, expect } from "@playwright/test";

// Practice (never carries prior solve state) rather than daily/archive, which
// would be unreliable across repeated runs once already solved.
test.describe("abandon confirm", () => {
  test("navigating away mid-puzzle prompts; Keep playing cancels, Leave proceeds", async ({ page }) => {
    await page.goto("/practice/play?difficulty=easy");

    // Any cell whose label ends in "empty" is guaranteed non-given (givens
    // always carry a placed symbol) — click it to create undo history.
    await page.getByRole("button", { name: /empty$/ }).first().click();

    await page.getByRole("link", { name: "Archive" }).click();
    const dialog = page.getByRole("dialog", { name: /Leave this puzzle/ });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/practice\/play/); // navigation was intercepted

    await dialog.getByRole("button", { name: "Keep playing" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/practice\/play/);

    await page.getByRole("link", { name: "Archive" }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Leave" }).click();
    await expect(page).toHaveURL(/\/archive$/);
  });
});
