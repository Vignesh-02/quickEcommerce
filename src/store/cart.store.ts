import { create } from "zustand";
import { CartSummary } from "@/lib/actions/cart";

export type CartItem = CartSummary["items"][number];

type CartState = {
    cartId: string | null;
    items: CartItem[];
    itemCount: number;
    subtotal: string;
    isAuthenticated: boolean;
    isLoading: boolean;
    setCart: (summary: CartSummary) => void;
    setLoading: (loading: boolean) => void;
    clearLocal: () => void;
};

export const useCartStore = create<CartState>((set) => ({
    cartId: null,
    items: [],
    itemCount: 0,
    subtotal: "0.00",
    isAuthenticated: false,
    isLoading: false,
    setCart: (summary) =>
        set({
            cartId: summary.cartId,
            items: summary.items,
            itemCount: summary.itemCount,
            subtotal: summary.subtotal,
            isAuthenticated: summary.isAuthenticated,
            isLoading: false,
        }),
    setLoading: (loading) => set({ isLoading: loading }),
    clearLocal: () =>
        set({
            cartId: null,
            items: [],
            itemCount: 0,
            subtotal: "0.00",
            isAuthenticated: false,
        }),
}));
