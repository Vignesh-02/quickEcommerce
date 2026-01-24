import { relations } from "drizzle-orm";
import {
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    uniqueIndex,
    integer,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { addresses } from "./addresses";
import { user } from "./user";
import { productVariants } from "./variants";

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
    "stripe",
    "paypal",
    "cod",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
    "initiated",
    "completed",
    "failed",
]);

export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull(),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    shippingAddressId: uuid("shipping_address_id")
        .notNull()
        .references(() => addresses.id, { onDelete: "restrict" }),
    billingAddressId: uuid("billing_address_id")
        .notNull()
        .references(() => addresses.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        productVariantId: uuid("product_variant_id")
            .notNull()
            .references(() => productVariants.id, { onDelete: "restrict" }),
        quantity: integer("quantity").notNull(),
        priceAtPurchase: numeric("price_at_purchase", {
            precision: 10,
            scale: 2,
        }).notNull(),
    },
    (table) => [
        uniqueIndex("order_items_unique").on(
            table.orderId,
            table.productVariantId
        ),
    ]
);

export const payments = pgTable(
    "payments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        method: paymentMethodEnum("method").notNull(),
        status: paymentStatusEnum("status").notNull(),
        paidAt: timestamp("paid_at"),
        transactionId: text("transaction_id"),
    },
    (table) => [uniqueIndex("payments_order_unique").on(table.orderId)]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(user, {
        fields: [orders.userId],
        references: [user.id],
    }),
    shippingAddress: one(addresses, {
        fields: [orders.shippingAddressId],
        references: [addresses.id],
        relationName: "shipping_address",
    }),
    billingAddress: one(addresses, {
        fields: [orders.billingAddressId],
        references: [addresses.id],
        relationName: "billing_address",
    }),
    items: many(orderItems),
    payment: one(payments, {
        fields: [orders.id],
        references: [payments.orderId],
    }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    variant: one(productVariants, {
        fields: [orderItems.productVariantId],
        references: [productVariants.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    order: one(orders, {
        fields: [payments.orderId],
        references: [orders.id],
    }),
}));

const decimalSchema = z.union([z.string(), z.number()]);

export const orderInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
    totalAmount: decimalSchema,
    shippingAddressId: z.string().uuid(),
    billingAddressId: z.string().uuid(),
    createdAt: z.date().optional(),
});

export const orderSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
    totalAmount: decimalSchema,
    shippingAddressId: z.string().uuid(),
    billingAddressId: z.string().uuid(),
    createdAt: z.date(),
});

export const orderItemInsertSchema = z.object({
    id: z.string().uuid().optional(),
    orderId: z.string().uuid(),
    productVariantId: z.string().uuid(),
    quantity: z.number().int().min(1),
    priceAtPurchase: decimalSchema,
});

export const orderItemSelectSchema = z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    productVariantId: z.string().uuid(),
    quantity: z.number().int().min(1),
    priceAtPurchase: decimalSchema,
});

export const paymentInsertSchema = z.object({
    id: z.string().uuid().optional(),
    orderId: z.string().uuid(),
    method: z.enum(["stripe", "paypal", "cod"]),
    status: z.enum(["initiated", "completed", "failed"]),
    paidAt: z.date().nullable().optional(),
    transactionId: z.string().nullable().optional(),
});

export const paymentSelectSchema = z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    method: z.enum(["stripe", "paypal", "cod"]),
    status: z.enum(["initiated", "completed", "failed"]),
    paidAt: z.date().nullable(),
    transactionId: z.string().nullable(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
