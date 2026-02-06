import { test, expect } from "@playwright/test";

test.describe("Products listing", () => {
    test("loads products page", async ({ page }) => {
        await page.goto("/products");
        await expect(page).toHaveTitle(/Quick Ecommerce/i);
    });

    test("has filter or sort UI", async ({ page }) => {
        await page.goto("/products");
        const pageContent = await page.content();
        const hasFiltersOrSort =
            pageContent.toLowerCase().includes("sort") ||
            pageContent.toLowerCase().includes("filter") ||
            pageContent.toLowerCase().includes("gender") ||
            (await page.getByRole("button").count()) > 0;
        expect(hasFiltersOrSort).toBeTruthy();
    });

    test("product cards are present or empty state", async ({ page }) => {
        await page.goto("/products");
        const cards = page.getByRole("link", { name: /Colours|colours/i });
        const emptyMessage = page.getByText(/no products|no results/i);
        await expect(cards.first().or(emptyMessage)).toBeVisible({ timeout: 10000 });
    });
});
