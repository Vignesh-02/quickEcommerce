import { relations } from "drizzle-orm";
import {
    integer,
    pgTable,
    timestamp,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { guest } from "./guest";
import { user } from "./user";
import { productVariants } from "./variants";

export const carts = pgTable("carts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, {
        onDelete: "set null",
    }),
    guestId: uuid("guest_id").references(() => guest.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable(
    "cart_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        cartId: uuid("cart_id")
            .notNull()
            .references(() => carts.id, { onDelete: "cascade" }),
        productVariantId: uuid("product_variant_id")
            .notNull()
            .references(() => productVariants.id, { onDelete: "restrict" }),
        quantity: integer("quantity").notNull(),
    },
    (table) => [
        uniqueIndex("cart_items_unique").on(
            table.cartId,
            table.productVariantId
        ),
    ]
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
    user: one(user, {
        fields: [carts.userId],
        references: [user.id],
    }),
    guest: one(guest, {
        fields: [carts.guestId],
        references: [guest.id],
    }),
    items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id],
    }),
    variant: one(productVariants, {
        fields: [cartItems.productVariantId],
        references: [productVariants.id],
    }),
}));

export const cartInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().nullable().optional(),
    guestId: z.string().uuid().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const cartSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid().nullable(),
    guestId: z.string().uuid().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const cartItemInsertSchema = z.object({
    id: z.string().uuid().optional(),
    cartId: z.string().uuid(),
    productVariantId: z.string().uuid(),
    quantity: z.number().int().min(1),
});

export const cartItemSelectSchema = z.object({
    id: z.string().uuid(),
    cartId: z.string().uuid(),
    productVariantId: z.string().uuid(),
    quantity: z.number().int().min(1),
});

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
