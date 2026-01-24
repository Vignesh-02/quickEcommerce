"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Heart, Search, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCart } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";
import { useFavoritesStore } from "@/store/favorites.store";
import { getFavorites } from "@/lib/actions/favorites";
import {
    createGuestSession,
    getCurrentUser,
    signOut,
} from "@/lib/auth/actions";

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<
        Array<{ id: string; name: string; price: string; imageUrl: string }>
    >([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSignedIn, setIsSignedIn] = useState(false);
    const router = useRouter();
    const itemCount = useCartStore((state) => state.itemCount);
    const setCart = useCartStore((state) => state.setCart);
    const setLoading = useCartStore((state) => state.setLoading);
    const clearLocalCart = useCartStore((state) => state.clearLocal);
    const favoritesCount = useFavoritesStore((state) => state.items.length);
    const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
    const setFavorites = useFavoritesStore((state) => state.setFavorites);

    const navLinks = [
        { label: "Men", href: "/products?gender=men" },
        { label: "Women", href: "/products?gender=women" },
        { label: "Kids", href: "/products?gender=kids" },
        { label: "Collections", href: "/products" },
        { label: "Contact", href: "/products" },
    ];

    const trimmedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

    const handleSearchSubmit = (event?: React.FormEvent) => {
        event?.preventDefault();
        const query = trimmedSearch;
        if (!query) {
            return;
        }
        router.push(`/products?search=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
        setSearchResults([]);
    };

    useEffect(() => {
        if (!isSearchOpen) {
            return;
        }
        if (!trimmedSearch) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/api/search?query=${encodeURIComponent(trimmedSearch)}`,
                    { signal: controller.signal }
                );
                if (!response.ok) {
                    setSearchResults([]);
                    return;
                }
                const data = (await response.json()) as {
                    results: Array<{
                        id: string;
                        name: string;
                        price: string;
                        imageUrl: string;
                    }>;
                };
                setSearchResults(data.results);
            } catch {
                if (!controller.signal.aborted) {
                    setSearchResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 250);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [trimmedSearch, isSearchOpen]);

    useEffect(() => {
        let isMounted = true;

        const loadCart = async () => {
            setLoading(true);
            try {
                const cart = await getCart({ createGuest: true });
                if (isMounted) {
                    setCart(cart);
                }
            } catch {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

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

        const loadFavorites = async () => {
            try {
                const favorites = await getFavorites();
                if (isMounted) {
                    setFavorites(
                        favorites.map((item) => ({
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
                }
            } catch {
                if (isMounted) {
                    setFavorites([]);
                }
            }
        };

        loadCart();
        loadFavorites();
        loadUser();
        return () => {
            isMounted = false;
        };
    }, [setCart, setLoading, setFavorites]);

    const handleSignOut = () => {
        startTransition(async () => {
            await signOut();
            setIsSignedIn(false);
            setIsMobileMenuOpen(false);
            clearLocalCart();
            clearFavorites();
            try {
                await createGuestSession();
                const cart = await getCart({ createGuest: true });
                setCart(cart);
            } catch {
                // Best effort: keep empty cart if guest session fails
            }
            router.push("/");
        });
    };

    return (
        <nav className="bg-[var(--color-light-100)] w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex-shrink-0" aria-label="Home">
                    <Image
                        src="/logo.svg"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="h-8 w-auto brightness-0"
                    />
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop Utility Links */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    <button
                        type="button"
                        onClick={() => setIsSearchOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity"
                    >
                        <Search className="h-4 w-4" />
                        Search
                    </button>
                    <Link
                        href="/favorites"
                        className="relative inline-flex items-center gap-2 text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity"
                    >
                        <span className="relative inline-flex">
                            <Heart className="h-5 w-5" />
                            {favoritesCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-dark-900)] px-1 text-footnote text-white">
                                    {favoritesCount}
                                </span>
                            )}
                        </span>
                        Favorites
                    </Link>
                    <Link
                        href="/cart"
                        className="relative inline-flex items-center gap-2 text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity"
                    >
                        <span className="relative inline-flex">
                            <ShoppingBag className="h-5 w-5" />
                            {itemCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-dark-900)] px-1 text-footnote text-white">
                                    {itemCount}
                                </span>
                            )}
                        </span>
                        My Cart
                    </Link>
                    {isSignedIn ? (
                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={isPending}
                            className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity disabled:opacity-60"
                        >
                            Sign out
                        </button>
                    ) : (
                        <>
                            <Link
                                href="/sign-in"
                                className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity"
                            >
                                Login
                            </Link>
                            <Link
                                href="/sign-up"
                                className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className="md:hidden flex flex-col gap-1.5 p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span
                        className={`block h-0.5 w-6 bg-[var(--color-dark-900)] transition-all ${
                            isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                        }`}
                    />
                    <span
                        className={`block h-0.5 w-6 bg-[var(--color-dark-900)] transition-all ${
                            isMobileMenuOpen ? "opacity-0" : ""
                        }`}
                    />
                    <span
                        className={`block h-0.5 w-6 bg-[var(--color-dark-900)] transition-all ${
                            isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                        }`}
                    />
                </button>
            </div>

            {/* Desktop Search */}
            {isSearchOpen && (
                <div className="mt-4 hidden md:block">
                    <div className="relative">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center gap-3 rounded-full border border-[var(--color-light-300)] bg-white px-4 py-2"
                        >
                            <Search className="h-4 w-4 text-[var(--color-dark-500)]" />
                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search products"
                                className="flex-1 bg-transparent text-body font-jost text-[var(--color-dark-900)] placeholder:text-[var(--color-light-400)] focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(false)}
                                className="text-[var(--color-dark-500)] hover:text-[var(--color-dark-900)]"
                                aria-label="Close search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </form>
                        {trimmedSearch && (
                            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-[var(--color-light-300)] bg-white p-3 shadow-lg">
                                {isSearching ? (
                                    <p className="text-footnote font-jost text-[var(--color-dark-500)]">
                                        Searching...
                                    </p>
                                ) : searchResults.length === 0 ? (
                                    <p className="text-footnote font-jost text-[var(--color-dark-500)]">
                                        No matches found.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {searchResults.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/products/${item.id}`}
                                                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-light-200)]"
                                                onClick={() =>
                                                    setIsSearchOpen(false)
                                                }
                                            >
                                                <div className="h-12 w-12 overflow-hidden rounded-lg bg-[var(--color-light-200)]">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-body font-jost text-[var(--color-dark-900)]">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-footnote font-jost text-[var(--color-dark-500)]">
                                                        ${item.price}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden mt-4 pb-4 border-t border-[var(--color-light-300)]">
                    <div className="flex flex-col gap-4 pt-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity px-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-[var(--color-light-300)] pt-4 mt-2">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex items-center gap-2 rounded-full border border-[var(--color-light-300)] bg-white px-4 py-2 mb-4"
                            >
                                <Search className="h-4 w-4 text-[var(--color-dark-500)]" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="Search products"
                                    className="flex-1 bg-transparent text-body font-jost text-[var(--color-dark-900)] placeholder:text-[var(--color-light-400)] focus:outline-none"
                                />
                            </form>
                            {trimmedSearch && searchResults.length > 0 && (
                                <div className="mb-4 flex flex-col gap-3">
                                    {searchResults.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/products/${item.id}`}
                                            className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--color-light-200)]"
                                            onClick={() =>
                                                setIsMobileMenuOpen(false)
                                            }
                                        >
                                            <div className="h-10 w-10 overflow-hidden rounded-lg bg-[var(--color-light-200)]">
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-body font-jost text-[var(--color-dark-900)]">
                                                    {item.name}
                                                </p>
                                                <p className="text-footnote font-jost text-[var(--color-dark-500)]">
                                                    ${item.price}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <Link
                                href="/favorites"
                                className="flex items-center gap-2 text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity px-2 mb-4"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="relative inline-flex">
                                    <Heart className="h-5 w-5" />
                                    {favoritesCount > 0 && (
                                        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-dark-900)] px-1 text-footnote text-white">
                                            {favoritesCount}
                                        </span>
                                    )}
                                </span>
                                Favorites
                            </Link>
                            <Link
                                href="/cart"
                                className="flex items-center gap-2 text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity px-2 mb-4"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="relative inline-flex">
                                    <ShoppingBag className="h-5 w-5" />
                                    {itemCount > 0 && (
                                        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-dark-900)] px-1 text-footnote text-white">
                                            {itemCount}
                                        </span>
                                    )}
                                </span>
                                My Cart
                            </Link>
                            {isSignedIn ? (
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    disabled={isPending}
                                    className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity px-2 mb-4 text-left disabled:opacity-60"
                                >
                                    Sign out
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/sign-in"
                                        className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity px-2 block mb-4"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/sign-up"
                                        className="text-body font-jost text-[var(--color-dark-900)] hover:opacity-70 transition-opacity px-2 block"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
