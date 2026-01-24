import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
    brands,
    categories,
    collections,
    colors,
    genders,
    productCollections,
    productImages,
    productVariants,
    products,
    sizes,
} from "./schema";

type SeedProduct = {
    name: string;
    description: string;
    categorySlug: string;
    genderSlug: string;
    basePrice: number;
    collectionSlugs: string[];
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const priceToString = (value: number) => value.toFixed(2);

const pickMany = <T>(items: T[], count: number) => {
    const copy = [...items];
    const picked: T[] = [];
    while (picked.length < count && copy.length > 0) {
        const index = Math.floor(Math.random() * copy.length);
        picked.push(copy.splice(index, 1)[0]);
    }
    return picked;
};

const buildImageMap = async () => {
    const sourceDir = path.join(process.cwd(), "public", "shoes");
    const destinationDir = path.join(
        process.cwd(),
        "static",
        "uploads",
        "shoes"
    );

    await fs.mkdir(destinationDir, { recursive: true });

    const files = (await fs.readdir(sourceDir)).filter((file) =>
        /\.(png|jpe?g|webp|avif)$/i.test(file)
    );

    if (files.length === 0) {
        throw new Error("No shoe images found in public/shoes.");
    }

    return {
        sourceDir,
        destinationDir,
        files,
    };
};

const copyImage = async (
    sourceDir: string,
    destinationDir: string,
    fileName: string,
    targetName: string
) => {
    const sourcePath = path.join(sourceDir, fileName);
    const destinationPath = path.join(destinationDir, targetName);
    await fs.copyFile(sourcePath, destinationPath);
    return `/static/uploads/shoes/${targetName}`;
};

const seed = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is required to seed the database.");
    }

    const imageMap = await buildImageMap();

    console.log("Clearing product-related tables...");
    await db.delete(productImages);
    await db.delete(productCollections);
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(collections);
    await db.delete(categories);
    await db.delete(brands);
    await db.delete(colors);
    await db.delete(sizes);
    await db.delete(genders);

    console.log("Seeding filters and brands...");
    const genderRows = [
        { id: randomUUID(), label: "Men", slug: "men" },
        { id: randomUUID(), label: "Women", slug: "women" },
        { id: randomUUID(), label: "Unisex", slug: "unisex" },
        { id: randomUUID(), label: "Kids", slug: "kids" },
    ];

    const colorRows = [
        { id: randomUUID(), name: "Black", slug: "black", hexCode: "#111111" },
        { id: randomUUID(), name: "White", slug: "white", hexCode: "#FFFFFF" },
        { id: randomUUID(), name: "Red", slug: "red", hexCode: "#E10600" },
        { id: randomUUID(), name: "Blue", slug: "blue", hexCode: "#1E40AF" },
        { id: randomUUID(), name: "Green", slug: "green", hexCode: "#15803D" },
        { id: randomUUID(), name: "Gray", slug: "gray", hexCode: "#6B7280" },
        {
            id: randomUUID(),
            name: "Yellow",
            slug: "yellow",
            hexCode: "#F59E0B",
        },
        { id: randomUUID(), name: "Pink", slug: "pink", hexCode: "#EC4899" },
        {
            id: randomUUID(),
            name: "Orange",
            slug: "orange",
            hexCode: "#F97316",
        },
        {
            id: randomUUID(),
            name: "Purple",
            slug: "purple",
            hexCode: "#7C3AED",
        },
    ];

    const sizeRows = [
        { id: randomUUID(), name: "6", slug: "6", sortOrder: 1 },
        { id: randomUUID(), name: "7", slug: "7", sortOrder: 2 },
        { id: randomUUID(), name: "8", slug: "8", sortOrder: 3 },
        { id: randomUUID(), name: "9", slug: "9", sortOrder: 4 },
        { id: randomUUID(), name: "10", slug: "10", sortOrder: 5 },
        { id: randomUUID(), name: "11", slug: "11", sortOrder: 6 },
        { id: randomUUID(), name: "12", slug: "12", sortOrder: 7 },
    ];

    await db.insert(genders).values(genderRows);
    await db.insert(colors).values(colorRows);
    await db.insert(sizes).values(sizeRows);

    const brandNikeId = randomUUID();
    await db.insert(brands).values({
        id: brandNikeId,
        name: "Nike",
        slug: "nike",
        logoUrl:
            "https://1000logos.net/wp-content/uploads/2017/03/Nike-Logo.png",
    });

    console.log("Seeding categories and collections...");
    const rootCategoryId = randomUUID();
    const categoryRows = [
        { id: rootCategoryId, name: "Shoes", slug: "shoes", parentId: null },
        {
            id: randomUUID(),
            name: "Running",
            slug: "running",
            parentId: rootCategoryId,
        },
        {
            id: randomUUID(),
            name: "Basketball",
            slug: "basketball",
            parentId: rootCategoryId,
        },
        {
            id: randomUUID(),
            name: "Training",
            slug: "training",
            parentId: rootCategoryId,
        },
        {
            id: randomUUID(),
            name: "Lifestyle",
            slug: "lifestyle",
            parentId: rootCategoryId,
        },
        {
            id: randomUUID(),
            name: "Skateboarding",
            slug: "skateboarding",
            parentId: rootCategoryId,
        },
        {
            id: randomUUID(),
            name: "Football",
            slug: "football",
            parentId: rootCategoryId,
        },
    ];
    await db.insert(categories).values(categoryRows);

    const collectionRows = [
        { id: randomUUID(), name: "Summer '25", slug: "summer-25" },
        { id: randomUUID(), name: "Air Essentials", slug: "air-essentials" },
        { id: randomUUID(), name: "Running Core", slug: "running-core" },
    ];
    await db.insert(collections).values(collectionRows);

    const categoryBySlug = new Map(
        categoryRows.map((item) => [item.slug, item.id])
    );
    const genderBySlug = new Map(
        genderRows.map((item) => [item.slug, item.id])
    );
    const collectionBySlug = new Map(
        collectionRows.map((item) => [item.slug, item.id])
    );

    console.log("Seeding products and variants...");
    const productSeeds: SeedProduct[] = [
        {
            name: "Nike Air Zoom Pegasus 41",
            description:
                "Daily trainer built for smooth transitions with responsive Zoom Air cushioning and breathable mesh.",
            categorySlug: "running",
            genderSlug: "men",
            basePrice: 129.99,
            collectionSlugs: ["running-core"],
        },
        {
            name: "Nike ZoomX Vaporfly Next% 3",
            description:
                "Race-ready super shoe featuring ZoomX foam and carbon plate for explosive energy return.",
            categorySlug: "running",
            genderSlug: "unisex",
            basePrice: 249.99,
            collectionSlugs: ["running-core"],
        },
        {
            name: "Nike React Infinity Run Flyknit 4",
            description:
                "Supportive running shoe with React cushioning designed to help reduce injury risk.",
            categorySlug: "running",
            genderSlug: "women",
            basePrice: 159.99,
            collectionSlugs: ["running-core"],
        },
        {
            name: "Nike Air Max 97",
            description:
                "Iconic full-length Air cushioning with premium materials and a streamlined silhouette.",
            categorySlug: "lifestyle",
            genderSlug: "unisex",
            basePrice: 179.99,
            collectionSlugs: ["air-essentials"],
        },
        {
            name: "Nike Air Force 1 '07",
            description:
                "Classic court style with crisp leather and Air cushioning for everyday comfort.",
            categorySlug: "lifestyle",
            genderSlug: "unisex",
            basePrice: 119.99,
            collectionSlugs: ["air-essentials"],
        },
        {
            name: "Nike Dunk Low",
            description:
                "Retro basketball-inspired low-top with durable leather and heritage color blocking.",
            categorySlug: "lifestyle",
            genderSlug: "unisex",
            basePrice: 109.99,
            collectionSlugs: ["air-essentials"],
        },
        {
            name: "Nike LeBron 21",
            description:
                "Explosive on-court performance with responsive cushioning and reinforced containment.",
            categorySlug: "basketball",
            genderSlug: "men",
            basePrice: 199.99,
            collectionSlugs: ["summer-25"],
        },
        {
            name: "Nike JA 1",
            description:
                "Dynamic basketball shoe tuned for speed and control with a lightweight build.",
            categorySlug: "basketball",
            genderSlug: "men",
            basePrice: 129.99,
            collectionSlugs: ["summer-25"],
        },
        {
            name: "Nike Metcon 9",
            description:
                "Stable training platform built for lifting, HIIT, and multidirectional work.",
            categorySlug: "training",
            genderSlug: "women",
            basePrice: 149.99,
            collectionSlugs: ["summer-25"],
        },
        {
            name: "Nike Free RN 5.0",
            description:
                "Minimalist feel with flexible sole for short runs and natural movement.",
            categorySlug: "training",
            genderSlug: "men",
            basePrice: 109.99,
            collectionSlugs: ["running-core"],
        },
        {
            name: "Nike SB Dunk Low Pro",
            description:
                "Skate-ready durability with Zoom Air cushioning and padded collar.",
            categorySlug: "skateboarding",
            genderSlug: "unisex",
            basePrice: 114.99,
            collectionSlugs: ["summer-25"],
        },
        {
            name: "Nike Blazer Mid '77",
            description:
                "Vintage hoops style with durable leather and classic mid-cut profile.",
            categorySlug: "lifestyle",
            genderSlug: "women",
            basePrice: 109.99,
            collectionSlugs: ["air-essentials"],
        },
        {
            name: "Nike Tiempo Legend 10",
            description:
                "Premium leather football boot with targeted touch zones for precision control.",
            categorySlug: "football",
            genderSlug: "men",
            basePrice: 229.99,
            collectionSlugs: ["summer-25"],
        },
        {
            name: "Nike Mercurial Vapor 15",
            description:
                "Speed-focused football boot with responsive traction and lightweight build.",
            categorySlug: "football",
            genderSlug: "unisex",
            basePrice: 259.99,
            collectionSlugs: ["summer-25"],
        },
        {
            name: "Nike Air Huarache",
            description:
                "Distinctive heel clip and neoprene bootie for snug, supportive comfort.",
            categorySlug: "lifestyle",
            genderSlug: "unisex",
            basePrice: 129.99,
            collectionSlugs: ["air-essentials"],
        },
    ];

    const productRows = productSeeds.map((seed) => ({
        id: randomUUID(),
        name: seed.name,
        description: seed.description,
        categoryId: categoryBySlug.get(seed.categorySlug)!,
        genderId: genderBySlug.get(seed.genderSlug)!,
        brandId: brandNikeId,
        isPublished: true,
        defaultVariantId: null,
    }));

    await db.insert(products).values(productRows);

    const variantsToInsert: (typeof productVariants.$inferInsert)[] = [];
    const productDefaultVariants = new Map<string, string>();
    const variantIdsByProductColor = new Map<string, string[]>();

    for (const product of productRows) {
        const selectedColors = pickMany(colorRows, 3);
        const selectedSizes = pickMany(sizeRows, 4);
        const basePrice =
            productSeeds.find((seed) => seed.name === product.name)
                ?.basePrice ?? 129.99;
        for (const color of selectedColors) {
            for (const size of selectedSizes) {
                const variantId = randomUUID();
                const sku = `NK-${slugify(product.name)}-${color.slug}-${
                    size.slug
                }`;
                const sale =
                    Math.random() > 0.75
                        ? priceToString(basePrice * 0.9)
                        : null;
                variantsToInsert.push({
                    id: variantId,
                    productId: product.id,
                    sku,
                    price: priceToString(basePrice),
                    salePrice: sale,
                    colorId: color.id,
                    sizeId: size.id,
                    inStock: Math.floor(Math.random() * 40) + 5,
                    weight: Number((0.7 + Math.random() * 0.6).toFixed(2)),
                    dimensions: {
                        length: 32,
                        width: 12,
                        height: 11,
                    },
                });

                const colorKey = `${product.id}:${color.id}`;
                const list = variantIdsByProductColor.get(colorKey) ?? [];
                list.push(variantId);
                variantIdsByProductColor.set(colorKey, list);

                if (!productDefaultVariants.has(product.id)) {
                    productDefaultVariants.set(product.id, variantId);
                }
            }
        }
    }

    await db.insert(productVariants).values(variantsToInsert);

    for (const [productId, variantId] of productDefaultVariants.entries()) {
        await db
            .update(products)
            .set({ defaultVariantId: variantId })
            .where(eq(products.id, productId));
    }

    console.log("Uploading and assigning images...");
    const imageRows: (typeof productImages.$inferInsert)[] = [];

    let imageIndex = 0;
    for (const product of productRows) {
        const imageCount = 3;
        const productImagesForRow = [];
        for (let i = 0; i < imageCount; i += 1) {
            const fileName = imageMap.files[imageIndex % imageMap.files.length];
            const targetName = `${slugify(product.name)}-${i + 1}-${fileName}`;
            const url = await copyImage(
                imageMap.sourceDir,
                imageMap.destinationDir,
                fileName,
                targetName
            );
            productImagesForRow.push(url);
            imageIndex += 1;
        }

        productImagesForRow.forEach((url, idx) => {
            imageRows.push({
                id: randomUUID(),
                productId: product.id,
                url,
                sortOrder: idx,
                isPrimary: idx === 0,
            });
        });

        const selectedColor = colorRows[0];
        const colorKey = `${product.id}:${selectedColor.id}`;
        const variantIds = variantIdsByProductColor.get(colorKey) ?? [];
        const variantId = variantIds[0];
        if (variantId) {
            const fileName = imageMap.files[imageIndex % imageMap.files.length];
            const targetName = `${slugify(product.name)}-variant-${fileName}`;
            const url = await copyImage(
                imageMap.sourceDir,
                imageMap.destinationDir,
                fileName,
                targetName
            );
            imageIndex += 1;
            imageRows.push({
                id: randomUUID(),
                productId: product.id,
                variantId,
                url,
                sortOrder: 99,
                isPrimary: false,
            });
        }
    }

    await db.insert(productImages).values(imageRows);

    console.log("Linking products to collections...");
    const collectionRowsToInsert: (typeof productCollections.$inferInsert)[] =
        [];

    productRows.forEach((product) => {
        const seed = productSeeds.find((item) => item.name === product.name);
        seed?.collectionSlugs.forEach((slug) => {
            const collectionId = collectionBySlug.get(slug);
            if (collectionId) {
                collectionRowsToInsert.push({
                    id: randomUUID(),
                    productId: product.id,
                    collectionId,
                });
            }
        });
    });

    await db.insert(productCollections).values(collectionRowsToInsert);

    console.log("Seed complete.");
};

seed()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    });
