import { test, expect } from "@playwright/test";

test.describe("tutorial", () => {
  test("walking all four beats reaches the live board and Finish returns to Play", async ({ page }) => {
    await page.goto("/tutorial");
    await expect(page.getByRole("heading", { name: "Two symbols." })).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Read the signs." })).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The line law." })).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Try one yourself." })).toBeVisible();

    // Solve the live 4x4 board via HINT until Finish appears.
    const hint = page.getByRole("button", { name: "HINT" });
    const finish = page.getByRole("button", { name: "Finish" });
    for (let i = 0; i < 20 && !(await finish.isVisible().catch(() => false)); i++) {
      await hint.click();
      await page.waitForTimeout(50);
    }
    await expect(finish).toBeVisible();
    await finish.click();
    await expect(page).toHaveURL(/\/play$/);
  });

  test("SKIP TUTORIAL returns home immediately", async ({ page }) => {
    await page.goto("/tutorial");
    await page.getByRole("button", { name: "SKIP TUTORIAL" }).click();
    await expect(page).toHaveURL("/");
  });
});
