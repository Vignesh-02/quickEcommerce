"use client";

import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import {
    addCartItem,
    clearCart,
    removeCartItem,
    updateCartItem,
    type CartSummary as CartSummaryType,
} from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";
import CartItemRow from "./CartItemRow";
import CartSummary from "./CartSummary";

type CartClientProps = {
    initialCart: CartSummaryType;
};

export default function CartClient({ initialCart }: CartClientProps) {
    const [isPending, startTransition] = useTransition();
    const items = useCartStore((state) => state.items);
    const cartId = useCartStore((state) => state.cartId);
    const summary = useCartStore((state) => ({
        cartId: state.cartId ?? initialCart.cartId,
        items: state.items,
        itemCount: state.itemCount,
        subtotal: state.subtotal,
        isAuthenticated: state.isAuthenticated,
    }));
    const setCart = useCartStore((state) => state.setCart);
    const setLoading = useCartStore((state) => state.setLoading);

    const hasHydrated = useRef(false);

    useEffect(() => {
        if (!hasHydrated.current) {
            setCart(initialCart);
            hasHydrated.current = true;
            return;
        }

        if (initialCart.isAuthenticated && initialCart.cartId !== cartId) {
            setCart(initialCart);
        }
    }, [initialCart, cartId, setCart]);

    const refresh = (promise: Promise<CartSummaryType>) => {
        setLoading(true);
        startTransition(async () => {
            const updated = await promise;
            setCart(updated);
        });
    };

    const handleIncrement = (item: (typeof items)[number]) => {
        refresh(addCartItem(item.variantId, 1));
    };

    const handleDecrement = (item: (typeof items)[number]) => {
        refresh(updateCartItem(item.id, item.quantity - 1));
    };

    const handleRemove = (item: (typeof items)[number]) => {
        refresh(removeCartItem(item.id));
    };

    const handleClear = () => {
        refresh(clearCart());
    };

    return (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)]">
            <section className="rounded-2xl border border-[var(--color-light-300)] bg-[var(--color-light-100)] p-6">
                <h1 className="text-heading-2 font-jost text-[var(--color-dark-900)]">
                    Your Cart
                </h1>
                <p className="mt-2 text-body font-jost text-[var(--color-dark-700)]">
                    Review your items and checkout when you’re ready.
                </p>

                <div className="mt-6 flex flex-col gap-6">
                    {items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-8 text-center text-body font-jost text-[var(--color-dark-700)]">
                            <p>Your cart is empty.</p>
                            <Link
                                href="/"
                                className="mt-4 inline-flex rounded-full bg-[var(--color-dark-900)] px-6 py-2 text-body font-jost text-white"
                            >
                                Return to Home
                            </Link>
                        </div>
                    ) : (
                        items.map((item) => (
                            <CartItemRow
                                key={item.id}
                                item={item}
                                onIncrement={handleIncrement}
                                onDecrement={handleDecrement}
                                onRemove={handleRemove}
                            />
                        ))
                    )}
                </div>

                {isPending && (
                    <p className="mt-4 text-footnote font-jost text-[var(--color-dark-500)]">
                        Updating cart...
                    </p>
                )}
            </section>

            {items.length > 0 && (
                <CartSummary summary={summary} onClear={handleClear} />
            )}
        </div>
    );
}
