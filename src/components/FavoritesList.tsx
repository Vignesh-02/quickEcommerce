"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components";
import {
    getFavorites,
    removeFavorite,
    updateFavoriteNote,
    updateFavoritePriority,
    type FavoriteRecord,
} from "@/lib/actions/favorites";
import { addCartItem } from "@/lib/actions/cart";
import { useFavoritesStore } from "@/store/favorites.store";

type FavoritesListProps = {
    initialFavorites: FavoriteRecord[];

    isAuthenticated: boolean;
};

export default function FavoritesList({
    initialFavorites,
    isAuthenticated,
}: FavoritesListProps) {
    const [items, setItems] = useState<FavoriteRecord[]>(initialFavorites);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const setFavorites = useFavoritesStore((state) => state.setFavorites);

    useEffect(() => {
        setFavorites(
            items.map((item) => ({
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
    }, [items, setFavorites]);

    if (!isAuthenticated) {
        return (
            <div className="rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-8 text-center text-body font-jost text-[var(--color-dark-700)]">
                <p>Sign in to see and manage your favorites.</p>
                <Link
                    href="/sign-in"
                    className="mt-4 inline-flex rounded-full bg-[var(--color-dark-900)] px-6 py-2 text-body font-jost text-white"
                >
                    Sign in
                </Link>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-8 text-center text-body font-jost text-[var(--color-dark-700)]">
                You have not favorited any products yet.
            </div>
        );
    }

    const handleRemove = async (favoriteId: string) => {
        const updated = await removeFavorite(favoriteId);
        setItems(updated);
    };

    const handleNoteUpdate = async (favoriteId: string, note: string) => {
        const updated = await updateFavoriteNote(favoriteId, note);
        setItems(updated);
    };

    const handlePriorityUpdate = async (
        favoriteId: string,
        priority: "low" | "medium" | "high"
    ) => {
        const updated = await updateFavoritePriority(favoriteId, priority);
        setItems(updated);
    };

    const handleAddToCart = (item: FavoriteRecord) => {
        if (!item.productVariantId) {
            return;
        }
        startTransition(async () => {
            await addCartItem(item.productVariantId, 1);
            const updated = await removeFavorite(item.id);
            setItems(updated);
            router.push("/cart");
        });
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--color-light-300)] bg-[var(--color-light-100)] p-4"
                >
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/products/${item.productId}`}
                            className="relative h-20 w-20 overflow-hidden rounded-xl bg-[var(--color-light-200)]"
                        >
                            {item.imageUrl && (
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </Link>
                        <div className="flex-1">
                            <Link
                                href={`/products/${item.productId}`}
                                className="text-body-medium font-jost text-[var(--color-dark-900)] hover:opacity-70"
                            >
                                {item.title}
                            </Link>
                            <p className="mt-1 text-footnote font-jost text-[var(--color-dark-500)]">
                                {item.colorName} · {item.sizeName}
                            </p>
                            <p className="mt-2 text-body font-jost text-[var(--color-dark-900)]">
                                ${item.price}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            disabled={isPending}
                            className="rounded-full bg-[var(--color-dark-900)] px-4 py-2 text-body font-jost text-white disabled:opacity-60"
                        >
                            Add to cart
                        </button>
                        <label className="text-footnote font-jost text-[var(--color-dark-700)]">
                            Note
                            <textarea
                                defaultValue={item.note ?? ""}
                                onBlur={(event) =>
                                    handleNoteUpdate(
                                        item.id,
                                        event.target.value
                                    )
                                }
                                className="mt-2 w-full rounded-xl border border-[var(--color-light-300)] px-3 py-2 text-body font-jost text-[var(--color-dark-900)]"
                                rows={3}
                            />
                        </label>
                        <label className="text-footnote font-jost text-[var(--color-dark-700)]">
                            Priority
                            <select
                                value={item.priority}
                                onChange={(event) =>
                                    handlePriorityUpdate(
                                        item.id,
                                        event.target.value as
                                            | "low"
                                            | "medium"
                                            | "high"
                                    )
                                }
                                className="mt-2 w-full rounded-full border border-[var(--color-light-300)] px-3 py-2 text-body font-jost text-[var(--color-dark-900)]"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="rounded-full border border-[var(--color-light-300)] px-4 py-2 text-body font-jost text-[var(--color-dark-900)]"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
