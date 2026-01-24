"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/store/cart.store";

type CartItemRowProps = {
    item: CartItem;
    onIncrement: (item: CartItem) => void;
    onDecrement: (item: CartItem) => void;
    onRemove: (item: CartItem) => void;
};

export default function CartItemRow({
    item,
    onIncrement,
    onDecrement,
    onRemove,
}: CartItemRowProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-[var(--color-light-300)] pb-6 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--color-light-200)]">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="112px"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-footnote text-[var(--color-dark-500)]">
                        No image
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-body-medium font-jost text-[var(--color-dark-900)]">
                            {item.productName}
                        </p>
                        <p className="text-footnote font-jost text-[var(--color-dark-700)]">
                            {item.colorName} · {item.sizeName}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="text-[var(--color-dark-700)] hover:text-[var(--color-dark-900)]"
                        onClick={() => onRemove(item)}
                        aria-label="Remove item"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-[var(--color-light-300)] px-3 py-2">
                        <button
                            type="button"
                            onClick={() => onDecrement(item)}
                            className="text-[var(--color-dark-900)]"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-body font-jost text-[var(--color-dark-900)]">
                            {item.quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => onIncrement(item)}
                            className="text-[var(--color-dark-900)]"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <p className="text-body-medium font-jost text-[var(--color-dark-900)]">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}
