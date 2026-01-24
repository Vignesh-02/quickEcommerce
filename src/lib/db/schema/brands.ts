import { relations } from "drizzle-orm";
import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";

export const brands = pgTable(
    "brands",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        logoUrl: text("logo_url"),
    },
    (table) => [uniqueIndex("brands_slug_unique").on(table.slug)]
);

export const brandsRelations = relations(brands, ({ many }) => ({
    products: many(products),
}));

export const brandInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
    logoUrl: z.string().url().nullable().optional(),
});

export const brandSelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().url().nullable(),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
