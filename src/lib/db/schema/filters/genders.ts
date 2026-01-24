import { relations } from "drizzle-orm";
import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "../products";

export const genders = pgTable(
    "genders",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        label: text("label").notNull(),
        slug: text("slug").notNull(),
    },
    (table) => [uniqueIndex("genders_slug_unique").on(table.slug)]
);

export const gendersRelations = relations(genders, ({ many }) => ({
    products: many(products),
}));

export const genderInsertSchema = z.object({
    id: z.string().uuid().optional(),
    label: z.string().min(1),
    slug: z.string().min(1),
});

export const genderSelectSchema = z.object({
    id: z.string().uuid(),
    label: z.string(),
    slug: z.string(),
});

export type Gender = typeof genders.$inferSelect;
export type NewGender = typeof genders.$inferInsert;
