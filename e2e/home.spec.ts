import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
    test("loads and shows main content", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/Quick Ecommerce/i);
    });

    test("shows Latest shoes section", async ({ page }) => {
        await page.goto("/");
        await expect(
            page.getByRole("heading", { name: /latest shoes/i })
        ).toBeVisible();
    });

    test("has navigation links", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("link", { name: /products/i }).first()).toBeVisible();
    });

    test("product cards link to product detail", async ({ page }) => {
        await page.goto("/");
        const productLink = page.getByRole("link", { name: /Colours/i }).first();
        await expect(productLink).toBeVisible();
        await productLink.click();
        await expect(page).toHaveURL(/\/products\/[a-f0-9-]+/);
    });
});
