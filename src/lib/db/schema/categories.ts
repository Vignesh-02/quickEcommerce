import { relations } from "drizzle-orm";
import {
    type AnyPgColumn,
    pgTable,
    text,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";

export const categories = pgTable(
    "categories",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        parentId: uuid("parent_id").references(
            (): AnyPgColumn => categories.id,
            {
                onDelete: "set null",
            }
        ),
    },
    (table) => [uniqueIndex("categories_slug_unique").on(table.slug)]
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "category_parent",
    }),
    children: many(categories, { relationName: "category_parent" }),
    products: many(products),
}));

export const categoryInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
    parentId: z.string().uuid().nullable().optional(),
});

export const categorySelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    parentId: z.string().uuid().nullable(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
