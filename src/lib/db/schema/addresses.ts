import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { user } from "./user";
import { orders } from "./orders";

export const addressTypeEnum = pgEnum("address_type", ["billing", "shipping"]);

export const addresses = pgTable("addresses", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    type: addressTypeEnum("type").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull(),
    postalCode: text("postal_code").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
});

export const addressesRelations = relations(addresses, ({ one, many }) => ({
    user: one(user, {
        fields: [addresses.userId],
        references: [user.id],
    }),
    shippingOrders: many(orders, {
        relationName: "shipping_address",
    }),
    billingOrders: many(orders, {
        relationName: "billing_address",
    }),
}));

export const addressInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    type: z.enum(["billing", "shipping"]),
    line1: z.string().min(1),
    line2: z.string().nullable().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
    isDefault: z.boolean().optional(),
});

export const addressSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    type: z.enum(["billing", "shipping"]),
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    isDefault: z.boolean(),
});

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
