"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import AddToCartButton from "./AddToCartButton";
import ProductGallery from "./ProductGallery";
import SizePicker from "./SizePicker";
import { useFavoritesStore } from "@/store/favorites.store";
import {
    addFavorite,
    removeFavorite,
    getFavorites,
} from "@/lib/actions/favorites";
import { getCurrentUser } from "@/lib/auth/actions";

type VariantInfo = {
    id: string;
    price: string;
    salePrice: string | null;
    inStock: number;
    size: { id: string; name: string; slug: string };
    color: { id: string; name: string; hexCode: string };
};

type ColorOption = {
    id: string;
    colorLabel: string;
    colorClass: string;
    images: Array<{ id: string; url: string; alt: string }>;
};

type ProductInteractiveProps = {
    product: {
        id: string;
        name: string;
        subtitle: string | null;
        price: string;
        compareAtPrice: string | null;
        variants: VariantInfo[];
    };
    colorOptions: ColorOption[];
};

const getDefaultColorId = (colors: ColorOption[], variants: VariantInfo[]) =>
    colors[0]?.id ?? variants[0]?.color.id ?? "";

export default function ProductInteractive({
    product,
    colorOptions,
}: ProductInteractiveProps) {
    const [selectedColorId, setSelectedColorId] = useState(
        getDefaultColorId(colorOptions, product.variants)
    );
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isSignedIn, setIsSignedIn] = useState(false);
    const router = useRouter();
    const setFavorites = useFavoritesStore((state) => state.setFavorites);

    const variantsByColor = useMemo(() => {
        const map = new Map<string, VariantInfo[]>();
        product.variants.forEach((variant) => {
            const list = map.get(variant.color.id) ?? [];
            list.push(variant);
            map.set(variant.color.id, list);
        });
        return map;
    }, [product.variants]);

    const activeVariants = useMemo(
        () => variantsByColor.get(selectedColorId) ?? [],
        [variantsByColor, selectedColorId]
    );

    const sizes = useMemo(
        () =>
            activeVariants.map((variant) => ({
                label: variant.size.name,
                value: variant.size.id,
                disabled: variant.inStock <= 0,
            })),
        [activeVariants]
    );

    useEffect(() => {
        const firstAvailable = activeVariants.find(
            (variant) => variant.inStock > 0
        );
        setSelectedSizeId(
            firstAvailable?.size.id ?? activeVariants[0]?.size.id ?? null
        );
    }, [selectedColorId, activeVariants]);

    useEffect(() => {
        let isMounted = true;
        const loadUser = async () => {
            try {
                const user = await getCurrentUser();
                if (isMounted) {
                    setIsSignedIn(Boolean(user?.id));
                }
            } catch {
                if (isMounted) {
                    setIsSignedIn(false);
                }
            }
        };
        loadUser();
        return () => {
            isMounted = false;
        };
    }, []);

    const selectedVariant = useMemo(
        () =>
            activeVariants.find(
                (variant) => variant.size.id === selectedSizeId
            ) ??
            activeVariants[0] ??
            product.variants[0],
        [activeVariants, selectedSizeId, product.variants]
    );

    const isFavorited = useFavoritesStore((state) =>
        state.isFavorited(selectedVariant?.id ?? "")
    );

    const displayPrice =
        selectedVariant?.salePrice ?? selectedVariant?.price ?? product.price;
    const comparePrice =
        selectedVariant?.salePrice && selectedVariant?.price
            ? selectedVariant.price
            : product.compareAtPrice;

    return (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-light-100)] px-3 py-1 text-footnote font-jost text-[var(--color-dark-700)] shadow-sm">
                    <Star className="h-4 w-4 text-[var(--color-dark-900)]" />
                    Highly Rated
                </div>
                <ProductGallery
                    variants={colorOptions}
                    selectedVariantId={selectedColorId}
                    onVariantChange={setSelectedColorId}
                />
            </div>

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-heading-3 font-jost text-[var(--color-dark-900)]">
                        {product.name}
                    </h1>
                    <p className="text-body font-jost text-[var(--color-dark-700)]">
                        {product.subtitle ?? "Nike Shoes"}
                    </p>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <p className="text-lead font-jost text-[var(--color-dark-900)]">
                            ${Number(displayPrice ?? "0").toFixed(2)}
                        </p>
                        {comparePrice && (
                            <span className="text-body font-jost text-[var(--color-dark-500)] line-through">
                                ${Number(comparePrice ?? "0").toFixed(2)}
                            </span>
                        )}
                    </div>
                    <p className="text-body font-jost text-[var(--color-green)]">
                        Extra 20% off w/ code SPORT
                    </p>
                </div>

                <div className="flex items-center gap-2 text-body font-jost text-[var(--color-dark-700)]">
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                                key={idx}
                                className={`h-4 w-4 ${
                                    idx < 4
                                        ? "text-[var(--color-dark-900)]"
                                        : "text-[var(--color-light-400)]"
                                }`}
                            />
                        ))}
                    </div>
                    <span>(10)</span>
                </div>

                <SizePicker
                    sizes={sizes}
                    selectedSize={selectedSizeId ?? undefined}
                    onSelect={setSelectedSizeId}
                />

                <div className="flex flex-col gap-3">
                    <AddToCartButton variantId={selectedVariant?.id} />
                    <button
                        type="button"
                        onClick={() => {
                            if (!isSignedIn) {
                                router.push("/sign-in?reason=favorites");
                                return;
                            }
                            if (!selectedVariant?.id) {
                                return;
                            }
                            startTransition(async () => {
                                if (isFavorited) {
                                    const current = await getFavorites();
                                    const favorite = current.find(
                                        (item) =>
                                            item.productVariantId ===
                                            selectedVariant?.id
                                    );
                                    if (favorite) {
                                        const updated = await removeFavorite(
                                            favorite.id
                                        );
                                        setFavorites(
                                            updated.map((item) => ({
                                                id: item.id,
                                                productId: item.productId,
                                                productVariantId:
                                                    item.productVariantId,
                                                title: item.title,
                                                subtitle: `${item.colorName} · ${item.sizeName}`,
                                                price: item.price,
                                                imageUrl: item.imageUrl,
                                                note: item.note,
                                                priority: item.priority,
                                            }))
                                        );
                                    }
                                    return;
                                }

                                const updated = await addFavorite(
                                    selectedVariant?.id ?? "",
                                    null,
                                    "medium"
                                );
                                setFavorites(
                                    updated.map((item) => ({
                                        id: item.id,
                                        productId: item.productId,
                                        productVariantId: item.productVariantId,
                                        title: item.title,
                                        subtitle: `${item.colorName} · ${item.sizeName}`,
                                        price: item.price,
                                        imageUrl: item.imageUrl,
                                        note: item.note,
                                        priority: item.priority,
                                    }))
                                );
                            });
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-light-300)] px-6 py-3 text-body font-jost text-[var(--color-dark-900)]"
                    >
                        <Heart
                            className={`h-4 w-4 ${
                                isFavorited && isSignedIn
                                    ? "fill-[var(--color-red)] text-[var(--color-red)]"
                                    : ""
                            }`}
                        />
                        {isPending
                            ? "Updating..."
                            : !isSignedIn
                            ? "Sign in to favorite"
                            : isFavorited
                            ? "Favorited"
                            : "Favorite"}
                    </button>
                </div>
            </div>
        </div>
    );
}
