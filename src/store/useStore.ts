import { create } from "zustand";

interface AppState {
    cart: string[];
    addToCart: (productId: string) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
}

export const useStore = create<AppState>((set) => ({
    cart: [],
    addToCart: (productId) =>
        set((state) => ({
            cart: [...state.cart, productId],
        })),
    removeFromCart: (productId) =>
        set((state) => ({
            cart: state.cart.filter((id) => id !== productId),
        })),
    clearCart: () => set({ cart: [] }),
}));
