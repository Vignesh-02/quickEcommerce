import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    type AnyPgColumn,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { brands } from "./brands";
import { categories } from "./categories";
import { collections } from "./collections";
import { genders } from "./filters/genders";
import { productVariants } from "./variants";

export const products = pgTable(
    "products",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        description: text("description"),
        categoryId: uuid("category_id")
            .notNull()
            .references(() => categories.id, { onDelete: "restrict" }),
        genderId: uuid("gender_id")
            .notNull()
            .references(() => genders.id, { onDelete: "restrict" }),
        brandId: uuid("brand_id")
            .notNull()
            .references(() => brands.id, { onDelete: "restrict" }),
        isPublished: boolean("is_published").default(false).notNull(),
        defaultVariantId: uuid("default_variant_id").references(
            (): AnyPgColumn => productVariants.id,
            { onDelete: "set null" }
        ),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("products_name_unique").on(table.name, table.brandId),
        index("products_brand_published_idx").on(
            table.brandId,
            table.isPublished
        ),
        index("products_category_published_idx").on(
            table.categoryId,
            table.isPublished
        ),
    ]
);

export const productImages = pgTable("product_images", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(
        (): AnyPgColumn => productVariants.id,
        {
            onDelete: "set null",
        }
    ),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
});

export const productCollections = pgTable(
    "product_collections",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        collectionId: uuid("collection_id")
            .notNull()
            .references(() => collections.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("product_collections_unique").on(
            table.productId,
            table.collectionId
        ),
    ]
);

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    gender: one(genders, {
        fields: [products.genderId],
        references: [genders.id],
    }),
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id],
    }),
    defaultVariant: one(productVariants, {
        fields: [products.defaultVariantId],
        references: [productVariants.id],
        relationName: "default_variant",
    }),
    variants: many(productVariants),
    images: many(productImages),
    collections: many(productCollections),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.productId],
        references: [products.id],
    }),
    variant: one(productVariants, {
        fields: [productImages.variantId],
        references: [productVariants.id],
    }),
}));

export const productCollectionsRelations = relations(
    productCollections,
    ({ one }) => ({
        product: one(products, {
            fields: [productCollections.productId],
            references: [products.id],
        }),
        collection: one(collections, {
            fields: [productCollections.collectionId],
            references: [collections.id],
        }),
    })
);

export const productInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    categoryId: z.string().uuid(),
    genderId: z.string().uuid(),
    brandId: z.string().uuid(),
    isPublished: z.boolean().optional(),
    defaultVariantId: z.string().uuid().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const productSelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    categoryId: z.string().uuid(),
    genderId: z.string().uuid(),
    brandId: z.string().uuid(),
    isPublished: z.boolean(),
    defaultVariantId: z.string().uuid().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const productImageInsertSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable().optional(),
    url: z.string().min(1),
    sortOrder: z.number().int().optional(),
    isPrimary: z.boolean().optional(),
});

export const productImageSelectSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    url: z.string(),
    sortOrder: z.number().int(),
    isPrimary: z.boolean(),
});

export const productCollectionInsertSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid(),
    collectionId: z.string().uuid(),
});

export const productCollectionSelectSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    collectionId: z.string().uuid(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type ProductCollection = typeof productCollections.$inferSelect;
export type NewProductCollection = typeof productCollections.$inferInsert;
