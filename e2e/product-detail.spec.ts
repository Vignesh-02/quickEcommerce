import { test, expect } from "@playwright/test";

test.describe("Product detail page", () => {
    test("navigates to product from listing and shows detail", async ({
        page,
    }) => {
        await page.goto("/products");
        const firstProductLink = page
            .locator('a[href^="/products/"]')
            .filter({ hasNotText: "Products" })
            .first();
        await firstProductLink.click();

        await expect(page).toHaveURL(/\/products\/[a-f0-9-]+/);
        await expect(
            page.getByRole("button", { name: /add to bag|add to cart/i }).or(
                page.getByText(/No reviews yet|reviews/i)
            )
        ).toBeVisible({ timeout: 10000 });
    });

    test("shows 404 for invalid product id", async ({ page }) => {
        await page.goto("/products/00000000-0000-0000-0000-000000000000");
        await expect(
            page.getByText(/product not found|not found/i)
        ).toBeVisible({ timeout: 10000 });
    });
});
