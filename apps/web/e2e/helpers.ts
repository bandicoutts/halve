import type { Page } from "@playwright/test";

const MAX_HINTS = 40; // well above any real puzzle's empty-cell count (max 36)

/**
 * Solves the puzzle currently on a `/play` route via repeated hints, if it
 * isn't already solved (re-running against an already-solved puzzle is a
 * no-op — see WEB-BOARD-REVIEW-1, the board mounts straight into review mode).
 * Resolves once the WinScreen dialog is visible.
 */
export async function solveIfNeeded(page: Page): Promise<void> {
  const winDialog = page.getByRole("dialog", { name: "Puzzle complete" });
  if (await winDialog.isVisible().catch(() => false)) return;

  const hint = page.getByRole("button", { name: "HINT" });
  for (let i = 0; i < MAX_HINTS; i++) {
    if (await winDialog.isVisible().catch(() => false)) return;
    if (!(await hint.isEnabled().catch(() => false))) break;
    await hint.click();
    await page.waitForTimeout(50); // let the reducer settle before the next click
  }
  await winDialog.waitFor({ state: "visible", timeout: 5000 });
}
