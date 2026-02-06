import Link from "next/link";
import { Suspense } from "react";
import { Card, CollapsibleSection, ProductInteractive, ReviewsSection } from "@/components";
import {
    getProduct,
    getRecommendedProducts,
} from "@/lib/actions/product";
import { getProductReviewStats } from "@/lib/actions/reviews";

type ProductVariant = {
    id: string;
    colorLabel: string;
    colorClass: string;
    images: Array<{ id: string; url: string; alt: string }>;
};

const colorClassMap: Record<string, string> = {
    "#111111": "bg-[var(--color-dark-900)]",
    "#FFFFFF": "bg-white",
    "#E10600": "bg-[var(--color-red)]",
    "#1E40AF": "bg-blue-600",
    "#15803D": "bg-[var(--color-green)]",
    "#6B7280": "bg-[var(--color-dark-500)]",
    "#F59E0B": "bg-[var(--color-orange)]",
    "#EC4899": "bg-pink-500",
    "#F97316": "bg-orange-500",
    "#7C3AED": "bg-purple-600",
};

const toColorClass = (hexCode: string | null) =>
    (hexCode && colorClassMap[hexCode.toUpperCase()]) ||
    "bg-[var(--color-light-200)]";

const buildVariants = (product: Awaited<ReturnType<typeof getProduct>>) => {
    if (!product) {
        return [];
    }

    const imagesByColor = new Map<string, ProductVariant["images"]>();

    product.variants.forEach((variant) => {
        const colorKey = variant.color.id;
        const currentImages = imagesByColor.get(colorKey) ?? [];
        const variantImages =
            product.imagesByVariant[variant.id] ??
            product.imagesByVariant.generic ??
            [];
        const merged = [...currentImages, ...variantImages].reduce<
            ProductVariant["images"]
        >((acc, image) => {
            if (acc.some((item) => item.id === image.id)) {
                return acc;
            }
            acc.push({
                id: image.id,
                url: image.url,
                alt: `${product.name} image`,
            });
            return acc;
        }, []);
        imagesByColor.set(colorKey, merged);
    });

    return product.variants.reduce<ProductVariant[]>((acc, variant) => {
        if (acc.some((item) => item.id === variant.color.id)) {
            return acc;
        }

        acc.push({
            id: variant.color.id,
            colorLabel: variant.color.name,
            colorClass: toColorClass(variant.color.hexCode),
            images: imagesByColor.get(variant.color.id) ?? [],
        });
        return acc;
    }, []);
};

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const product = await getProduct(resolvedParams.id);

    if (!product) {
        return (
            <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-10 text-center">
                    <h1 className="text-heading-3 font-jost text-[var(--color-dark-900)]">
                        Product not found
                    </h1>
                    <p className="mt-2 text-body font-jost text-[var(--color-dark-700)]">
                        The product you’re looking for doesn’t exist or is no
                        longer available.
                    </p>
                    <Link
                        href="/products"
                        className="mt-6 inline-flex rounded-full bg-[var(--color-dark-900)] px-6 py-3 text-body font-jost text-white"
                    >
                        Back to products
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <nav
                aria-label="Breadcrumb"
                className="mb-6 text-body font-jost text-[var(--color-dark-700)]"
            >
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link
                            href="/"
                            className="hover:text-[var(--color-dark-900)]"
                        >
                            Home
                        </Link>
                    </li>
                    <li className="text-[var(--color-light-400)]">/</li>
                    <li>
                        <Link
                            href="/products"
                            className="hover:text-[var(--color-dark-900)]"
                        >
                            Products
                        </Link>
                    </li>
                    {product.category?.name && product.category.slug && (
                        <>
                            <li className="text-[var(--color-light-400)]">/</li>
                            <li>
                                <Link
                                    href={`/products?category=${product.category.slug}`}
                                    className="hover:text-[var(--color-dark-900)]"
                                >
                                    {product.category.name}
                                </Link>
                            </li>
                        </>
                    )}
                    <li className="text-[var(--color-light-400)]">/</li>
                    <li>
                        <span className="text-[var(--color-dark-900)]">
                            {product.name}
                        </span>
                    </li>
                </ol>
            </nav>

            <ProductInteractive
                product={{
                    id: product.id,
                    name: product.name,
                    subtitle: product.subtitle,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    variants: product.variants,
                }}
                colorOptions={buildVariants(product)}
                reviewStats={await getProductReviewStats(product.id)}
            />

            <div className="mt-10 flex flex-col gap-4">
                <CollapsibleSection title="Product Details" defaultOpen>
                    <p>{product.description ?? ""}</p>
                    <ul className="mt-4 list-disc space-y-2 pl-5">
                        <li>Premium cushioning</li>
                        <li>Breathable upper</li>
                        <li>Style: {product.id}</li>
                    </ul>
                </CollapsibleSection>
                <CollapsibleSection title="Shipping & Returns">
                    Returns accepted within 30 days. Shipping timelines and
                    costs are calculated at checkout.
                </CollapsibleSection>
                <Suspense fallback={<ReviewsFallback />}>
                    <ReviewsSection productId={product.id} />
                </Suspense>
            </div>

            <section className="mt-16">
                <h2 className="text-heading-3 font-jost text-[var(--color-dark-900)]">
                    You Might Also Like
                </h2>
                <Suspense fallback={<RecommendationsFallback />}>
                    <RecommendationsSection productId={product.id} />
                </Suspense>
            </section>
        </main>
    );
}


const RecommendationsSection = async ({ productId }: { productId: string }) => {
    const items = await getRecommendedProducts(productId);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <Card
                    key={item.id}
                    title={item.title}
                    subtitle="Nike Shoes"
                    meta="Recommended"
                    price={item.price}
                    imageSrc={item.imageUrl}
                    href={`/products/${item.id}`}
                />
            ))}
        </div>
    );
};

const ReviewsFallback = () => (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-light-300)]" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-[var(--color-light-300)]" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[var(--color-light-300)]" />
    </div>
);

const RecommendationsFallback = () => (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
            <div
                key={idx}
                className="h-80 animate-pulse rounded-2xl bg-[var(--color-light-200)]"
            />
        ))}
    </div>
);
