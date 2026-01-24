import FavoritesList from "@/components/FavoritesList";
import { getFavorites, type FavoriteRecord } from "@/lib/actions/favorites";
import { getCurrentUser } from "@/lib/auth/actions";

export default async function FavoritesPage() {
    let favorites: FavoriteRecord[] = [];
    let isAuthenticated = false;
    try {
        favorites = await getFavorites();
    } catch {
        favorites = [];
    }
    try {
        const user = await getCurrentUser();
        isAuthenticated = Boolean(user?.id);
    } catch {
        isAuthenticated = false;
    }

    return (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-heading-2 font-jost text-[var(--color-dark-900)]">
                    Favorites
                </h1>
                <p className="text-body font-jost text-[var(--color-dark-700)]">
                    Products you’ve saved for later.
                </p>
            </div>
            <FavoritesList
                initialFavorites={favorites}
                isAuthenticated={isAuthenticated}
            />
        </main>
    );
}
