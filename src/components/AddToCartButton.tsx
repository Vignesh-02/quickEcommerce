"use client";

import { useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { addCartItem } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";

type AddToCartButtonProps = {
    variantId?: string;
    label?: string;
};

export default function AddToCartButton({
    variantId,
    label = "Add to Bag",
}: AddToCartButtonProps) {
    const [isPending, startTransition] = useTransition();
    const setCart = useCartStore((state) => state.setCart);
    const setLoading = useCartStore((state) => state.setLoading);

    const handleAdd = () => {
        if (!variantId) {
            return;
        }

        setLoading(true);
        startTransition(async () => {
            const updated = await addCartItem(variantId, 1);
            setCart(updated);
        });
    };

    return (
        <button
            type="button"
            onClick={handleAdd}
            disabled={!variantId || isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-dark-900)] px-6 py-3 text-body font-jost text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
            <ShoppingBag className="h-4 w-4" />
            {isPending ? "Adding..." : label}
        </button>
    );
}
