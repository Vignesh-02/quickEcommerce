"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    carts,
    cartItems,
    colors,
    guest,
    productImages,
    productVariants,
    products,
    sizes,
    type Cart,
} from "@/lib/db/schema";
import { getSession, guestSession } from "@/lib/auth/actions";

export type CartItemDetail = {
    id: string;
    cartId: string;
    productId: string;
    productName: string;
    variantId: string;
    colorName: string;
    sizeName: string;
    imageUrl: string | null;
    price: string;
    quantity: number;
};

export type CartSummary = {
    cartId: string;
    items: CartItemDetail[];
    itemCount: number;
    subtotal: string;
    isAuthenticated: boolean;
};

const toNumber = (value: string | null | undefined) =>
    Number(value ?? "0") || 0;

const getOrCreateCart = async (createGuest = true) => {
    const session = await getSession();

    if (session.user?.id) {
        const [existing] = await db
            .select()
            .from(carts)
            .where(eq(carts.userId, session.user.id))
            .limit(1);

        if (existing) {
            return { cart: existing, isAuthenticated: true };
        }

        const [created] = await db
            .insert(carts)
            .values({ userId: session.user.id })
            .returning();

        return { cart: created, isAuthenticated: true };
    }

    if (!createGuest) {
        if (!session.guestSessionToken) {
            return { cart: null, isAuthenticated: false };
        }

        const [guestRecord] = await db
            .select()
            .from(guest)
            .where(eq(guest.sessionToken, session.guestSessionToken))
            .limit(1);

        if (!guestRecord) {
            return { cart: null, isAuthenticated: false };
        }

        const [existing] = await db
            .select()
            .from(carts)
            .where(eq(carts.guestId, guestRecord.id))
            .limit(1);

        if (!existing) {
            return { cart: null, isAuthenticated: false };
        }

        return { cart: existing, isAuthenticated: false };
    }

    const guestResult = await guestSession();
    if (!guestResult.success || !guestResult.sessionToken) {
        console.error("guestSession failed in getOrCreateCart", {
            error: guestResult.error,
            hasToken: Boolean(guestResult.sessionToken),
        });
        throw new Error("Unable to create guest session.");
    }

    const [guestRecord] = await db
        .select()
        .from(guest)
        .where(eq(guest.sessionToken, guestResult.sessionToken))
        .limit(1);

    if (!guestRecord) {
        throw new Error("Guest session not found.");
    }

    const [existing] = await db
        .select()
        .from(carts)
        .where(eq(carts.guestId, guestRecord.id))
        .limit(1);

    if (existing) {
        return { cart: existing, isAuthenticated: false };
    }

    const [created] = await db
        .insert(carts)
        .values({ guestId: guestRecord.id })
        .returning();

    return { cart: created, isAuthenticated: false };
};

const requireCart = (result: {
    cart: Cart | null;
    isAuthenticated: boolean;
}) => {
    if (!result.cart) {
        throw new Error("Cart not found.");
    }
    return result as { cart: Cart; isAuthenticated: boolean };
};

const getCartItems = async (cartId: string) => {
    const variantImage = sql<string | null>`
        (array_agg(${productImages.url}) filter (where ${productImages.variantId} = ${productVariants.id}))[1]
    `;
    const genericImage = sql<string | null>`
        (array_agg(${productImages.url}) filter (where ${productImages.variantId} is null))[1]
    `;
    const imageUrl = sql<
        string | null
    >`coalesce(${variantImage}, ${genericImage})`;
    const unitPrice = sql<string>`coalesce(${productVariants.salePrice}, ${productVariants.price})`;

    const rows = await db
        .select({
            id: cartItems.id,
            cartId: cartItems.cartId,
            productId: products.id,
            productName: products.name,
            variantId: productVariants.id,
            colorName: colors.name,
            sizeName: sizes.name,
            imageUrl,
            price: unitPrice,
            quantity: cartItems.quantity,
        })
        .from(cartItems)
        .innerJoin(
            productVariants,
            eq(cartItems.productVariantId, productVariants.id)
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .innerJoin(colors, eq(productVariants.colorId, colors.id))
        .innerJoin(sizes, eq(productVariants.sizeId, sizes.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(cartItems.cartId, cartId))
        .groupBy(
            cartItems.id,
            cartItems.cartId,
            products.id,
            productVariants.id,
            colors.id,
            sizes.id
        )
        .orderBy(desc(cartItems.id));

    return rows;
};

const buildSummary = (
    cartId: string,
    items: CartItemDetail[],
    isAuthenticated: boolean
): CartSummary => {
    const subtotalValue = items.reduce(
        (sum, item) => sum + toNumber(item.price) * item.quantity,
        0
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
        cartId,
        items,
        itemCount,
        subtotal: subtotalValue.toFixed(2),
        isAuthenticated,
    };
};

export const getCart = async (
    options: { createGuest?: boolean } = {}
): Promise<CartSummary> => {
    const { createGuest = false } = options;
    const { cart, isAuthenticated } = await getOrCreateCart(createGuest);

    if (!cart) {
        return buildSummary("", [], isAuthenticated);
    }

    const items = await getCartItems(cart.id);
    return buildSummary(cart.id, items, isAuthenticated);
};

export const getCartForUser = async (userId: string): Promise<CartSummary> => {
    const [existing] = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

    const cart =
        existing ??
        (await db
            .insert(carts)
            .values({ userId })
            .returning()
            .then((rows) => rows[0]));

    const items = await getCartItems(cart.id);
    return buildSummary(cart.id, items, true);
};

export const addCartItem = async (
    variantId: string,
    quantity = 1
): Promise<CartSummary> => {
    const { cart, isAuthenticated } = requireCart(await getOrCreateCart());
    const [existing] = await db
        .select()
        .from(cartItems)
        .where(
            and(
                eq(cartItems.cartId, cart.id),
                eq(cartItems.productVariantId, variantId)
            )
        )
        .limit(1);

    if (existing) {
        await db
            .update(cartItems)
            .set({ quantity: existing.quantity + quantity })
            .where(eq(cartItems.id, existing.id));
    } else {
        await db.insert(cartItems).values({
            cartId: cart.id,
            productVariantId: variantId,
            quantity,
        });
    }

    const items = await getCartItems(cart.id);
    return buildSummary(cart.id, items, isAuthenticated);
};

export const updateCartItem = async (
    cartItemId: string,
    quantity: number
): Promise<CartSummary> => {
    const { cart, isAuthenticated } = requireCart(await getOrCreateCart());

    if (quantity <= 0) {
        await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    } else {
        await db
            .update(cartItems)
            .set({ quantity })
            .where(eq(cartItems.id, cartItemId));
    }

    const items = await getCartItems(cart.id);
    return buildSummary(cart.id, items, isAuthenticated);
};

export const removeCartItem = async (
    cartItemId: string
): Promise<CartSummary> => {
    const { cart, isAuthenticated } = requireCart(await getOrCreateCart());
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    const items = await getCartItems(cart.id);
    return buildSummary(cart.id, items, isAuthenticated);
};

export const clearCart = async (): Promise<CartSummary> => {
    const { cart, isAuthenticated } = requireCart(await getOrCreateCart());
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    return buildSummary(cart.id, [], isAuthenticated);
};

export const mergeGuestCartIntoUserCart = async (
    userId: string,
    guestSessionToken: string
): Promise<void> => {
    const [guestRecord] = await db
        .select()
        .from(guest)
        .where(eq(guest.sessionToken, guestSessionToken))
        .limit(1);

    if (!guestRecord) {
        return;
    }

    const [guestCart] = await db
        .select()
        .from(carts)
        .where(eq(carts.guestId, guestRecord.id))
        .limit(1);

    if (!guestCart) {
        return;
    }

    const [userCart] = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);

    const resolvedUserCart =
        userCart ??
        (await db
            .insert(carts)
            .values({ userId })
            .returning()
            .then((rows) => rows[0]));

    const guestItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, guestCart.id));

    if (guestItems.length === 0) {
        return;
    }

    await db
        .insert(cartItems)
        .values(
            guestItems.map((item) => ({
                cartId: resolvedUserCart.id,
                productVariantId: item.productVariantId,
                quantity: item.quantity,
            }))
        )
        .onConflictDoUpdate({
            target: [cartItems.cartId, cartItems.productVariantId],
            set: {
                quantity: sql`${cartItems.quantity} + excluded.quantity`,
            },
        });

    await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
    await db.delete(carts).where(eq(carts.id, guestCart.id));
};
