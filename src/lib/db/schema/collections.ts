import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { productCollections } from "./products";

export const collections = pgTable(
    "collections",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [uniqueIndex("collections_slug_unique").on(table.slug)]
);

export const collectionsRelations = relations(collections, ({ many }) => ({
    productLinks: many(productCollections),
}));

export const collectionInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    slug: z.string().min(1),
    createdAt: z.date().optional(),
});

export const collectionSelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.date(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
