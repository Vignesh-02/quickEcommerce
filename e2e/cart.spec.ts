import { test, expect } from "@playwright/test";

test.describe("Cart page", () => {
    test("cart page loads", async ({ page }) => {
        await page.goto("/cart");
        await expect(page).toHaveTitle(/Quick Ecommerce/i);
    });

    test("shows cart content or empty state", async ({ page }) => {
        await page.goto("/cart");
        await expect(
            page
                .getByText(/your cart|return to home|your cart is empty/i)
                .first()
        ).toBeVisible({ timeout: 10000 });
    });
});
