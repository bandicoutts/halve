import { test, expect } from "@playwright/test";

test.describe("theme toggle", () => {
  test("switches on click and persists across a reload", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";

    await page.getByRole("switch", { name: "Toggle theme" }).click();
    await expect(html).not.toHaveClass(before);
    const after = (await html.getAttribute("class")) ?? "";

    await page.reload();
    await expect(html).toHaveClass(after);

    // Leave it as found, so this test doesn't change what later tests see.
    await page.getByRole("switch", { name: "Toggle theme" }).click();
    await expect(html).toHaveClass(before);
  });
});
