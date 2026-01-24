"use server";

import {
    and,
    asc,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    lte,
    or,
    sql,
    isNull,
    isNotNull,
    type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
    brands,
    categories,
    colors,
    genders,
    productImages,
    productVariants,
    products,
    reviews,
    sizes,
    user,
} from "@/lib/db/schema";
import {
    buildProductQueryObject,
    type ProductFilterParams,
} from "@/lib/utils/query";

export type ProductListItem = {
    id: string;
    name: string;
    categoryName: string | null;
    genderLabel: string | null;
    minPrice: string | null;
    maxPrice: string | null;
    imageUrls: string[];
    colorCount: number;
    createdAt: Date;
};

export type ProductListResult = {
    products: ProductListItem[];
    totalCount: number;
};

export type ProductDetail = {
    id: string;
    name: string;
    description: string | null;
    subtitle: string | null;
    price: string;
    compareAtPrice: string | null;
    category: { id: string; name: string; slug: string } | null;
    brand: { id: string; name: string; slug: string } | null;
    gender: { id: string; label: string; slug: string } | null;
    variants: Array<{
        id: string;
        sku: string;
        price: string;
        salePrice: string | null;
        inStock: number;
        size: { id: string; name: string; slug: string };
        color: { id: string; name: string; slug: string; hexCode: string };
    }>;
    images: Array<{
        id: string;
        url: string;
        variantId: string | null;
        sortOrder: number;
        isPrimary: boolean;
    }>;
    imagesByVariant: Record<string, ProductDetail["images"]>;
};

export type ReviewItem = {
    id: string;
    author: string;
    rating: number;
    title?: string;
    content: string;
    createdAt: string;
};

export type RecommendedProduct = {
    id: string;
    title: string;
    price: string;
    imageUrl: string;
};

const buildFilters = (query: ReturnType<typeof buildProductQueryObject>) => {
    const conditions: SQL[] = [eq(products.isPublished, true)];

    if (query.search) {
        const term = `%${query.search}%`;
        const searchCondition = sql<boolean>`
            (${products.name} ilike ${term} or coalesce(${products.description}, '') ilike ${term})
        `;
        conditions.push(searchCondition);
    }

    if (query.genders.length > 0) {
        conditions.push(inArray(genders.slug, query.genders));
    }

    if (query.categories.length > 0) {
        conditions.push(inArray(categories.slug, query.categories));
    }

    if (query.brands.length > 0) {
        conditions.push(inArray(brands.slug, query.brands));
    }

    if (query.colors.length > 0) {
        conditions.push(inArray(colors.slug, query.colors));
    }

    if (query.sizes.length > 0) {
        conditions.push(inArray(sizes.slug, query.sizes));
    }

    if (query.priceRanges.length > 0) {
        const rangeFilters = query.priceRanges.map((range) =>
            and(
                gte(productVariants.price, range.min.toFixed(2)),
                lte(productVariants.price, range.max.toFixed(2))
            )
        );
        const priceCondition = sql<boolean>`(${sql.join(
            rangeFilters,
            sql` or `
        )})`;
        conditions.push(priceCondition);
    } else {
        if (query.priceMin !== undefined) {
            conditions.push(
                gte(productVariants.price, query.priceMin.toFixed(2))
            );
        }

        if (query.priceMax !== undefined) {
            conditions.push(
                lte(productVariants.price, query.priceMax.toFixed(2))
            );
        }
    }

    return conditions.length > 1 ? and(...conditions) : conditions[0];
};

export const getAllProducts = async (
    params: Partial<ProductFilterParams> = {}
): Promise<ProductListResult> => {
    const query = buildProductQueryObject(params);
    const where = buildFilters(query);
    const minPriceSql = sql<string>`min(${productVariants.price})`;
    const maxPriceSql = sql<string>`max(${productVariants.price})`;
    const colorCountSql = sql<number>`count(distinct ${productVariants.colorId})`;
    const imageFilter =
        query.colors.length > 0
            ? and(
                  isNotNull(productImages.variantId),
                  eq(productImages.variantId, productVariants.id),
                  inArray(colors.slug, query.colors)
              )
            : isNull(productImages.variantId);

    const imageUrlsSql = sql<string[]>`
        coalesce(
            array_remove(
                array_agg(distinct ${productImages.url}) filter (where ${imageFilter}),
                null
            ),
            '{}'
        )
    `;

    const orderBy =
        query.sortBy === "price_asc"
            ? asc(minPriceSql)
            : query.sortBy === "price_desc"
            ? desc(maxPriceSql)
            : query.sortBy === "latest" || query.sortBy === "newest"
            ? desc(products.createdAt)
            : desc(products.createdAt);

    const productRows = await db
        .select({
            id: products.id,
            name: products.name,
            categoryName: categories.name,
            genderLabel: genders.label,
            minPrice: minPriceSql,
            maxPrice: maxPriceSql,
            imageUrls: imageUrlsSql,
            colorCount: colorCountSql,
            createdAt: products.createdAt,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(genders, eq(products.genderId, genders.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(productVariants, eq(productVariants.productId, products.id))
        .leftJoin(colors, eq(productVariants.colorId, colors.id))
        .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(where)
        .groupBy(products.id, categories.name, genders.label)
        .orderBy(orderBy)
        .limit(query.limit)
        .offset(query.offset);

    const totalCountResult = await db
        .select({
            count: sql<number>`count(distinct ${products.id})`,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(genders, eq(products.genderId, genders.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(productVariants, eq(productVariants.productId, products.id))
        .leftJoin(colors, eq(productVariants.colorId, colors.id))
        .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
        .where(where);

    return {
        products: productRows.map((row) => ({
            ...row,
            imageUrls: row.imageUrls ?? [],
            colorCount: Number(row.colorCount ?? 0),
        })),
        totalCount: totalCountResult[0]?.count ?? 0,
    };
};

export const getProduct = async (
    productId: string
): Promise<ProductDetail | null> => {
    const productRows = await db
        .select({
            id: products.id,
            name: products.name,
            description: products.description,
            categoryId: categories.id,
            categoryName: categories.name,
            categorySlug: categories.slug,
            brandId: brands.id,
            brandName: brands.name,
            brandSlug: brands.slug,
            genderId: genders.id,
            genderLabel: genders.label,
            genderSlug: genders.slug,
            variantId: productVariants.id,
            sku: productVariants.sku,
            price: productVariants.price,
            salePrice: productVariants.salePrice,
            inStock: productVariants.inStock,
            sizeId: sizes.id,
            sizeName: sizes.name,
            sizeSlug: sizes.slug,
            colorId: colors.id,
            colorName: colors.name,
            colorSlug: colors.slug,
            colorHex: colors.hexCode,
            imageId: productImages.id,
            imageUrl: productImages.url,
            imageVariantId: productImages.variantId,
            imageSortOrder: productImages.sortOrder,
            imagePrimary: productImages.isPrimary,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(genders, eq(products.genderId, genders.id))
        .leftJoin(productVariants, eq(productVariants.productId, products.id))
        .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
        .leftJoin(colors, eq(productVariants.colorId, colors.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(products.id, productId));

    if (productRows.length === 0) {
        return null;
    }

    const base = productRows[0];
    const variantsMap = new Map<string, ProductDetail["variants"][number]>();
    const imagesMap = new Map<string, ProductDetail["images"][number]>();

    for (const row of productRows) {
        if (row.variantId && !variantsMap.has(row.variantId)) {
            variantsMap.set(row.variantId, {
                id: row.variantId,
                sku: row.sku ?? "",
                price: row.price ?? "0",
                salePrice: row.salePrice ?? null,
                inStock: row.inStock ?? 0,
                size: {
                    id: row.sizeId ?? "",
                    name: row.sizeName ?? "",
                    slug: row.sizeSlug ?? "",
                },
                color: {
                    id: row.colorId ?? "",
                    name: row.colorName ?? "",
                    slug: row.colorSlug ?? "",
                    hexCode: row.colorHex ?? "",
                },
            });
        }

        if (row.imageId && !imagesMap.has(row.imageId)) {
            imagesMap.set(row.imageId, {
                id: row.imageId,
                url: row.imageUrl ?? "",
                variantId: row.imageVariantId ?? null,
                sortOrder: row.imageSortOrder ?? 0,
                isPrimary: row.imagePrimary ?? false,
            });
        }
    }

    const images = Array.from(imagesMap.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder
    );
    const imagesByVariant = images.reduce<
        Record<string, ProductDetail["images"]>
    >((acc, image) => {
        const key = image.variantId ?? "generic";
        const list = acc[key] ?? [];
        list.push(image);
        acc[key] = list;
        return acc;
    }, {});

    const prices = Array.from(variantsMap.values()).map((variant) =>
        Number(variant.salePrice ?? variant.price ?? "0")
    );
    const basePrice = Array.from(variantsMap.values()).map((variant) =>
        Number(variant.price ?? "0")
    );
    const minPrice = Math.min(...basePrice);
    const minSalePrice = Math.min(...prices);
    const price =
        Number.isFinite(minSalePrice) && minSalePrice > 0
            ? minSalePrice
            : minPrice;
    const compareAtPrice =
        Number.isFinite(minSalePrice) &&
        minSalePrice > 0 &&
        minPrice !== minSalePrice
            ? minPrice
            : null;

    return {
        id: base.id,
        name: base.name,
        description: base.description,
        subtitle: base.categoryName ?? base.genderLabel ?? null,
        price: Number.isFinite(price) ? price.toFixed(2) : "0.00",
        compareAtPrice: compareAtPrice ? compareAtPrice.toFixed(2) : null,
        category: base.categoryId
            ? {
                  id: base.categoryId,
                  name: base.categoryName ?? "",
                  slug: base.categorySlug ?? "",
              }
            : null,
        brand: base.brandId
            ? {
                  id: base.brandId,
                  name: base.brandName ?? "",
                  slug: base.brandSlug ?? "",
              }
            : null,
        gender: base.genderId
            ? {
                  id: base.genderId,
                  label: base.genderLabel ?? "",
                  slug: base.genderSlug ?? "",
              }
            : null,
        variants: Array.from(variantsMap.values()),
        images,
        imagesByVariant,
    };
};

export const getProductReviews = async (
    productId: string
): Promise<ReviewItem[]> => {
    const reviewRows = await db
        .select({
            id: reviews.id,
            rating: reviews.rating,
            content: reviews.comment,
            createdAt: reviews.createdAt,
            authorName: user.name,
            authorEmail: user.email,
        })
        .from(reviews)
        .leftJoin(user, eq(reviews.userId, user.id))
        .where(eq(reviews.productId, productId))
        .orderBy(desc(reviews.createdAt))
        .limit(10);

    if (reviewRows.length === 0) {
        return [
            {
                id: "sample-1",
                author: "Sneaker Fan",
                rating: 5,
                title: "All-day comfort",
                content:
                    "Super comfortable and the colorway looks even better in person.",
                createdAt: new Date().toISOString(),
            },
            {
                id: "sample-2",
                author: "Runner Pro",
                rating: 4,
                title: "Great cushioning",
                content:
                    "Lightweight and responsive, especially during longer walks.",
                createdAt: new Date().toISOString(),
            },
        ];
    }

    return reviewRows.map((row) => ({
        id: row.id,
        author: row.authorName || row.authorEmail || "Anonymous",
        rating: row.rating,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
    }));
};

export const getRecommendedProducts = async (
    productId: string
): Promise<RecommendedProduct[]> => {
    const current = await db
        .select({
            categoryId: products.categoryId,
            brandId: products.brandId,
            genderId: products.genderId,
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

    if (current.length === 0) {
        return [];
    }

    const { categoryId, genderId } = current[0];
    const minPriceSql = sql<string>`min(${productVariants.price})`;
    const imageUrlsSql = sql<string[]>`
        coalesce(
            array_remove(
                array_agg(distinct ${productImages.url}) filter (where ${productImages.url} is not null),
                null
            ),
            '{}'
        )
    `;

    const rows = await db
        .select({
            id: products.id,
            title: products.name,
            price: minPriceSql,
            imageUrls: imageUrlsSql,
        })
        .from(products)
        .leftJoin(productVariants, eq(productVariants.productId, products.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(
            and(
                eq(products.isPublished, true),
                eq(products.categoryId, categoryId),
                eq(products.genderId, genderId),
                sql<boolean>`(${products.id} <> ${productId})`
            )
        )
        .groupBy(products.id)
        .having(sql`count(${productImages.id}) > 0`)
        .limit(6);

    return rows
        .map((row) => ({
            id: row.id,
            title: row.title,
            price: Number(row.price ?? "0").toFixed(2),
            imageUrl: row.imageUrls?.[0] ?? "",
        }))
        .filter((row) => row.imageUrl);
};
