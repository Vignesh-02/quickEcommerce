"use server";

import { cookies, headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    carts,
    cartItems,
    guest,
    productImages,
    productVariants,
    products,
} from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import { mergeGuestSessionIfNeeded } from "@/lib/utils/mergeSessions";

type CheckoutLineItem = {
    name: string;
    imageUrl: string | null;
    unitAmount: number;
    quantity: number;
    variantId: string;
};

const getCartLineItems = async (
    cartId: string
): Promise<CheckoutLineItem[]> => {
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
            name: products.name,
            imageUrl,
            unitPrice,
            quantity: cartItems.quantity,
            variantId: productVariants.id,
        })
        .from(cartItems)
        .innerJoin(
            productVariants,
            eq(cartItems.productVariantId, productVariants.id)
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(cartItems.cartId, cartId))
        .groupBy(productVariants.id, products.id, cartItems.id);

    return rows.map((row) => ({
        name: row.name,
        imageUrl: row.imageUrl,
        unitAmount: Math.round(Number(row.unitPrice ?? "0") * 100),
        quantity: row.quantity,
        variantId: row.variantId,
    }));
};

const resolveCart = async (cartId: string) => {
    const session = await mergeGuestSessionIfNeeded();
    if (session.user?.id) {
        const [cart] = await db
            .select()
            .from(carts)
            .where(eq(carts.userId, session.user.id))
            .limit(1);

        if (!cart) {
            throw new Error("Cart not found for user.");
        }

        return { cartId: cart.id, userId: session.user.id };
    }

    const cookieStore = await cookies();
    const guestSessionToken = cookieStore.get("guest_session")?.value;
    if (!guestSessionToken) {
        throw new Error("Guest session not found.");
    }

    const [guestRecord] = await db
        .select()
        .from(guest)
        .where(eq(guest.sessionToken, guestSessionToken))
        .limit(1);

    if (!guestRecord) {
        throw new Error("Guest session not found.");
    }

    const [cart] = await db
        .select()
        .from(carts)
        .where(and(eq(carts.guestId, guestRecord.id), eq(carts.id, cartId)))
        .limit(1);

    if (!cart) {
        throw new Error("Cart not found for guest.");
    }

    return { cartId: cart.id, userId: null };
};

const getBaseUrl = async () => {
    const origin = (await headers()).get("origin");
    return origin ?? "http://localhost:3000";
};

const toAbsoluteUrl = (url: string | null, baseUrl: string) => {
    if (!url) {
        return null;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    return new URL(url, baseUrl).toString();
};

export const createStripeCheckoutSession = async (cartId: string) => {
    const resolvedCart = await resolveCart(cartId);
    const lineItems = await getCartLineItems(resolvedCart.cartId);

    if (lineItems.length === 0) {
        throw new Error("Cart is empty.");
    }

    const baseUrl = await getBaseUrl();

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        billing_address_collection: "required",
        shipping_address_collection: {
            allowed_countries: ["US", "CA", "IN"],
        },
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cart`,
        client_reference_id: resolvedCart.cartId,
        metadata: {
            cartId: resolvedCart.cartId,
            userId: resolvedCart.userId ?? "",
        },
        line_items: lineItems.map((item) => {
            const imageUrl = toAbsoluteUrl(item.imageUrl, baseUrl);
            return {
                quantity: item.quantity,
                price_data: {
                    currency: "usd",
                    unit_amount: item.unitAmount,
                    product_data: {
                        name: item.name,
                        images: imageUrl ? [imageUrl] : undefined,
                        metadata: {
                            variantId: item.variantId,
                        },
                    },
                },
            };
        }),
    });

    if (!session.url) {
        throw new Error("Unable to create Stripe checkout session.");
    }

    return session.url;
};
