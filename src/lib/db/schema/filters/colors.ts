import { relations } from "drizzle-orm";
import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { productVariants } from "../variants";

export const colors = pgTable(
    "colors",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        hexCode: text("hex_code").notNull(),
    },
    (table) => [uniqueIndex("colors_slug_unique").on(table.slug)]
);

export const colorsRelations = relations(colors, ({ many }) => ({
    variants: many(productVariants),
}));

export const colorInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
    hexCode: z.string().min(4),
});

export const colorSelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    hexCode: z.string(),
});

export type Color = typeof colors.$inferSelect;
export type NewColor = typeof colors.$inferInsert;
