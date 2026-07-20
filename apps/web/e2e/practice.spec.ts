import { test, expect } from "@playwright/test";
import { solveIfNeeded } from "./helpers";

test.describe("practice", () => {
  test("solving a practice puzzle and starting another gives a fresh board", async ({ page }) => {
    await page.goto("/practice");
    await page.getByRole("button", { name: "Easy" }).click();
    await expect(page).toHaveURL(/\/practice\/play\?/);

    // Practice never carries prior solve state (unlike daily/archive) — each
    // visit is a fresh random puzzle, so this always exercises the real solve.
    await solveIfNeeded(page);
    const winDialog = page.getByRole("dialog", { name: "Puzzle complete" });
    await expect(winDialog).toBeVisible();
    // Anchored to "SOLVED" — the keepsake card also shows "PRACTICE" on its
    // own, so an unanchored match is ambiguous.
    await expect(winDialog.getByText(/^SOLVED.*PRACTICE/)).toBeVisible();

    const firstUrl = page.url();
    await page.getByRole("button", { name: "Another puzzle" }).click();
    await expect(page).toHaveURL(/\/practice\/play\?/);
    await expect(page).not.toHaveURL(firstUrl);

    // A genuinely fresh board — not still showing the previous solve (guards
    // the WEB-BUGS-1 fix: BoardScreen must remount on a new `r` slot).
    await expect(winDialog).not.toBeVisible();
  });
});
