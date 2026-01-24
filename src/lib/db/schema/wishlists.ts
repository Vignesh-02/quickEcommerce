import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";
import { user } from "./user";

export const wishlists = pgTable(
    "wishlists",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        addedAt: timestamp("added_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("wishlists_unique").on(table.userId, table.productId),
    ]
);

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
    user: one(user, {
        fields: [wishlists.userId],
        references: [user.id],
    }),
    product: one(products, {
        fields: [wishlists.productId],
        references: [products.id],
    }),
}));

export const wishlistInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    productId: z.string().uuid(),
    addedAt: z.date().optional(),
});

export const wishlistSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    productId: z.string().uuid(),
    addedAt: z.date(),
});

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
