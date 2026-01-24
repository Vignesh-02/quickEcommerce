"use client";

import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { CartSummary as CartSummaryType } from "@/lib/actions/cart";
import { createStripeCheckoutSession } from "@/lib/actions/checkout";

type CartSummaryProps = {
    summary: CartSummaryType;
    onClear: () => void;
};

export default function CartSummary({ summary, onClear }: CartSummaryProps) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleCheckout = () => {
        if (summary.itemCount === 0) {
            return;
        }

        setError(null);
        startTransition(async () => {
            try {
                const url = await createStripeCheckoutSession(summary.cartId);
                window.location.assign(url);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to start checkout."
                );
            }
        });
    };

    return (
        <aside className="w-full rounded-2xl border border-[var(--color-light-300)] bg-[var(--color-light-100)] p-6">
            <h2 className="text-heading-3 font-jost text-[var(--color-dark-900)]">
                Order Summary
            </h2>
            <div className="mt-6 space-y-3 text-body font-jost text-[var(--color-dark-700)]">
                <div className="flex items-center justify-between">
                    <span>Items</span>
                    <span>{summary.itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>${summary.subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
                <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isPending || summary.itemCount === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-dark-900)] px-6 py-3 text-body font-jost text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <ShoppingBag className="h-4 w-4" />
                    {isPending ? "Redirecting..." : "Checkout"}
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="flex w-full items-center justify-center rounded-full border border-[var(--color-light-300)] px-6 py-3 text-body font-jost text-[var(--color-dark-900)]"
                >
                    Clear Cart
                </button>
                {error && (
                    <p className="text-footnote font-jost text-[var(--color-red)]">
                        {error}
                    </p>
                )}
            </div>
        </aside>
    );
}
