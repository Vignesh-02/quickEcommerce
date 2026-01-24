import {
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const discountTypeEnum = pgEnum("discount_type", [
    "percentage",
    "fixed",
]);

export const coupons = pgTable(
    "coupons",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        code: text("code").notNull(),
        discountType: discountTypeEnum("discount_type").notNull(),
        discountValue: numeric("discount_value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        maxUsage: integer("max_usage").notNull(),
        usedCount: integer("used_count").default(0).notNull(),
    },
    (table) => [uniqueIndex("coupons_code_unique").on(table.code)]
);

const decimalSchema = z.union([z.string(), z.number()]);

export const couponInsertSchema = z.object({
    id: z.string().uuid().optional(),
    code: z.string().min(1),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: decimalSchema,
    expiresAt: z.date(),
    maxUsage: z.number().int().min(1),
    usedCount: z.number().int().optional(),
});

export const couponSelectSchema = z.object({
    id: z.string().uuid(),
    code: z.string(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: decimalSchema,
    expiresAt: z.date(),
    maxUsage: z.number().int(),
    usedCount: z.number().int(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
