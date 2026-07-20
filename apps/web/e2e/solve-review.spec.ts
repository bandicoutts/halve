import { test, expect } from "@playwright/test";
import { solveIfNeeded } from "./helpers";

// Regression coverage for WEB-BOARD-REVIEW-1 — /play and /play/[date] used to
// always mount a fresh, empty board, even when the signed-in user had already
// solved that puzzle (reported as: Home's "Review your solve" looked
// unsolved, and Archive's already-solved today cell did too).
test.describe("solve review mode", () => {
  test("Home's Review your solve reopens the puzzle already solved, not empty", async ({ page }) => {
    await page.goto("/play");
    await solveIfNeeded(page);
    await expect(page.getByRole("dialog", { name: "Puzzle complete" })).toBeVisible();

    await page.goto("/");
    const reviewLink = page.getByRole("link", { name: "Review your solve" });
    await expect(reviewLink).toBeVisible();
    await reviewLink.click();

    // The regression: this must show the review state immediately, not a
    // fresh playable board that only "looks" unsolved.
    await expect(page.getByRole("dialog", { name: "Puzzle complete" })).toBeVisible();
  });

  test("Archive's solved today cell opens the puzzle already solved, not empty", async ({ page }) => {
    await page.goto("/play");
    await solveIfNeeded(page);

    await page.goto("/archive");
    // DayCell's aria-label is "Play today, {difficulty}, solved" for the
    // current day once it's solved — no href/date to read, it's a button.
    await page.getByRole("button", { name: /^Play today,.*solved$/ }).click();

    await expect(page).toHaveURL(/\/play\/\d{4}-\d{2}-\d{2}$/);
    const winDialog = page.getByRole("dialog", { name: "Puzzle complete" });
    await expect(winDialog).toBeVisible();
    // Case-sensitive: distinguishes the ALL-CAPS kicker ("SOLVED · NO. 201 · ARCHIVE")
    // from the dialog's own lowercase "Back to archive" / "From the archive" text.
    await expect(winDialog.getByText(/ARCHIVE$/)).toBeVisible();
  });
});
