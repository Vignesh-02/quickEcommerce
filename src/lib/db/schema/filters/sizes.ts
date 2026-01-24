import { relations } from "drizzle-orm";
import { integer, pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { productVariants } from "../variants";

export const sizes = pgTable(
    "sizes",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        sortOrder: integer("sort_order").notNull(),
    },
    (table) => [uniqueIndex("sizes_slug_unique").on(table.slug)]
);

export const sizesRelations = relations(sizes, ({ many }) => ({
    variants: many(productVariants),
}));

export const sizeInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
    sortOrder: z.number().int(),
});

export const sizeSelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    sortOrder: z.number().int(),
});

export type Size = typeof sizes.$inferSelect;
export type NewSize = typeof sizes.$inferInsert;
