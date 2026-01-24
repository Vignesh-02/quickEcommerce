import { relations } from "drizzle-orm";
import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";
import { productVariants } from "./variants";
import { user } from "./user";

export const favoritePriorityEnum = pgEnum("favorite_priority", [
    "low",
    "medium",
    "high",
]);

export const favorites = pgTable(
    "favorites",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        productVariantId: uuid("product_variant_id")
            .notNull()
            .references(() => productVariants.id, { onDelete: "cascade" }),
        note: text("note"),
        priority: favoritePriorityEnum("priority").default("medium").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("favorites_user_variant_unique").on(
            table.userId,
            table.productVariantId
        ),
        index("favorites_user_priority_idx").on(table.userId, table.priority),
    ]
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(user, {
        fields: [favorites.userId],
        references: [user.id],
    }),
    product: one(products, {
        fields: [favorites.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [favorites.productVariantId],
        references: [productVariants.id],
    }),
}));

export const favoriteInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    productId: z.string().uuid(),
    productVariantId: z.string().uuid(),
    note: z.string().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const favoriteSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    productId: z.string().uuid(),
    productVariantId: z.string().uuid(),
    note: z.string().nullable(),
    priority: z.enum(["low", "medium", "high"]),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
