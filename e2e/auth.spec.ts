import { test, expect } from "@playwright/test";

test.describe("Auth pages", () => {
    test("sign-in page loads", async ({ page }) => {
        await page.goto("/sign-in");
        await expect(
            page.getByRole("heading", { name: /welcome back|sign in|log in/i })
        ).toBeVisible({ timeout: 10000 });
    });

    test("sign-up page loads", async ({ page }) => {
        await page.goto("/sign-up");
        await expect(
            page.getByRole("heading", { name: /join nike|sign up|register/i })
        ).toBeVisible({ timeout: 10000 });
    });
});
