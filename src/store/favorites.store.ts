import { create } from "zustand";

export type FavoriteItem = {
    id: string;
    productId?: string;
    productVariantId?: string;
    title: string;
    subtitle: string;
    price: string;
    imageUrl?: string | null;
    note?: string | null;
    priority?: "low" | "medium" | "high";
};

type FavoritesState = {
    items: FavoriteItem[];
    isFavorited: (id: string) => boolean;
    setFavorites: (items: FavoriteItem[]) => void;
    toggleFavorite: (item: FavoriteItem) => void;
    removeFavorite: (id: string) => void;
    clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    items: [],
    isFavorited: (id) =>
        get().items.some(
            (item) =>
                (item.productVariantId ?? item.productId ?? item.id) === id
        ),
    setFavorites: (items) => set({ items }),
    toggleFavorite: (item) =>
        set((state) => {
            const key = item.productVariantId ?? item.productId ?? item.id;
            const exists = state.items.some(
                (entry) =>
                    (entry.productVariantId ?? entry.productId ?? entry.id) ===
                    key
            );
            return {
                items: exists
                    ? state.items.filter(
                          (entry) =>
                              (entry.productVariantId ??
                                  entry.productId ??
                                  entry.id) !== key
                      )
                    : [...state.items, item],
            };
        }),
    removeFavorite: (id) =>
        set((state) => ({
            items: state.items.filter((entry) => entry.id !== id),
        })),
    clearFavorites: () => set({ items: [] }),
}));
