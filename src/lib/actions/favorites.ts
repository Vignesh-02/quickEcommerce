"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    favorites,
    products,
    productVariants,
    productImages,
    sizes,
    colors,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth/actions";

export type FavoriteRecord = {
    id: string;
    productId: string;
    productVariantId: string;
    title: string;
    sizeName: string;
    colorName: string;
    price: string;
    imageUrl: string | null;
    note: string | null;
    priority: "low" | "medium" | "high";
};

const priorityOrderSql = sql<number>`case
    when ${favorites.priority} = 'high' then 3
    when ${favorites.priority} = 'medium' then 2
    else 1
end`;

const variantImage = sql<string | null>`
    (array_agg(${productImages.url}) filter (where ${productImages.variantId} = ${productVariants.id}))[1]
`;
const genericImage = sql<string | null>`
    (array_agg(${productImages.url}) filter (where ${productImages.variantId} is null))[1]
`;
const imageUrlSql = sql<
    string | null
>`coalesce(${variantImage}, ${genericImage})`;
const unitPriceSql = sql<string>`coalesce(${productVariants.salePrice}, ${productVariants.price})`;

const getUserId = async () => {
    const session = await getSession();
    if (!session.user?.id) {
        return null;
    }
    return session.user.id;
};

export const getFavorites = async (): Promise<FavoriteRecord[]> => {
    const userId = await getUserId();
    if (!userId) {
        return [];
    }

    const rows = await db
        .select({
            id: favorites.id,
            productId: products.id,
            productVariantId: productVariants.id,
            title: products.name,
            sizeName: sizes.name,
            colorName: colors.name,
            price: unitPriceSql,
            imageUrl: imageUrlSql,
            note: favorites.note,
            priority: favorites.priority,
        })
        .from(favorites)
        .innerJoin(
            productVariants,
            eq(favorites.productVariantId, productVariants.id)
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .innerJoin(sizes, eq(productVariants.sizeId, sizes.id))
        .innerJoin(colors, eq(productVariants.colorId, colors.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(favorites.userId, userId))
        .groupBy(
            favorites.id,
            products.id,
            productVariants.id,
            sizes.id,
            colors.id
        )
        .orderBy(desc(priorityOrderSql), desc(favorites.updatedAt));

    return rows.map((row) => ({
        ...row,
        price: Number(row.price ?? "0").toFixed(2),
        imageUrl: row.imageUrl,
    }));
};

export const addFavorite = async (
    productVariantId: string,
    note: string | null = null,
    priority: "low" | "medium" | "high" = "medium"
): Promise<FavoriteRecord[]> => {
    const userId = await getUserId();
    console.info("addFavorite userId", { userId, productVariantId });
    if (!userId) {
        return [];
    }

    const [variant] = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(eq(productVariants.id, productVariantId))
        .limit(1);

    if (!variant) {
        return getFavorites();
    }

    await db
        .insert(favorites)
        .values({
            userId,
            productId: variant.productId,
            productVariantId,
            note,
            priority,
        })
        .onConflictDoUpdate({
            target: [favorites.userId, favorites.productVariantId],
            set: {
                note,
                priority,
                updatedAt: new Date(),
            },
        });

    return getFavorites();
};

export const updateFavoriteNote = async (
    favoriteId: string,
    note: string
): Promise<FavoriteRecord[]> => {
    const userId = await getUserId();
    if (!userId) {
        return [];
    }
    await db
        .update(favorites)
        .set({ note, updatedAt: new Date() })
        .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)));

    return getFavorites();
};

export const updateFavoritePriority = async (
    favoriteId: string,
    priority: "low" | "medium" | "high"
): Promise<FavoriteRecord[]> => {
    const userId = await getUserId();
    if (!userId) {
        return [];
    }
    await db
        .update(favorites)
        .set({ priority, updatedAt: new Date() })
        .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)));

    return getFavorites();
};

export const removeFavorite = async (
    favoriteId: string
): Promise<FavoriteRecord[]> => {
    const userId = await getUserId();
    if (!userId) {
        return [];
    }
    await db
        .delete(favorites)
        .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)));

    return getFavorites();
};
