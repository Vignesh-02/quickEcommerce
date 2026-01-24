import { relations } from "drizzle-orm";
import {
    integer,
    index,
    jsonb,
    numeric,
    pgTable,
    real,
    text,
    timestamp,
    type AnyPgColumn,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { productImages, products } from "./products";
import { colors } from "./filters/colors";
import { sizes } from "./filters/sizes";
import { cartItems } from "./carts";
import { orderItems } from "./orders";

export const productVariants = pgTable(
    "product_variants",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references((): AnyPgColumn => products.id, {
                onDelete: "cascade",
            }),
        sku: text("sku").notNull(),
        price: numeric("price", { precision: 10, scale: 2 }).notNull(),
        salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
        colorId: uuid("color_id")
            .notNull()
            .references(() => colors.id, { onDelete: "restrict" }),
        sizeId: uuid("size_id")
            .notNull()
            .references(() => sizes.id, { onDelete: "restrict" }),
        inStock: integer("in_stock").default(0).notNull(),
        weight: real("weight").notNull(),
        dimensions: jsonb("dimensions").$type<{
            length: number;
            width: number;
            height: number;
        }>(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("product_variants_sku_unique").on(table.sku),
        index("product_variants_color_product_idx").on(
            table.colorId,
            table.productId
        ),
    ]
);

export const productVariantsRelations = relations(
    productVariants,
    ({ one, many }) => ({
        product: one(products, {
            fields: [productVariants.productId],
            references: [products.id],
        }),
        color: one(colors, {
            fields: [productVariants.colorId],
            references: [colors.id],
        }),
        size: one(sizes, {
            fields: [productVariants.sizeId],
            references: [sizes.id],
        }),
        images: many(productImages),
        cartItems: many(cartItems),
        orderItems: many(orderItems),
    })
);

const decimalSchema = z.union([z.string(), z.number()]);

export const productVariantInsertSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid(),
    sku: z.string().min(1),
    price: decimalSchema,
    salePrice: decimalSchema.nullable().optional(),
    colorId: z.string().uuid(),
    sizeId: z.string().uuid(),
    inStock: z.number().int().optional(),
    weight: z.number(),
    dimensions: z
        .object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
        })
        .nullable()
        .optional(),
    createdAt: z.date().optional(),
});

export const productVariantSelectSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    sku: z.string(),
    price: decimalSchema,
    salePrice: decimalSchema.nullable(),
    colorId: z.string().uuid(),
    sizeId: z.string().uuid(),
    inStock: z.number().int(),
    weight: z.number(),
    dimensions: z
        .object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
        })
        .nullable(),
    createdAt: z.date(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
