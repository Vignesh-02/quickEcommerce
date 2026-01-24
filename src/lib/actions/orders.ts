"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    addresses,
    carts,
    cartItems,
    orderItems,
    orders,
    payments,
    productImages,
    productVariants,
    products,
    user,
} from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";

const toNumber = (value: string | null | undefined) =>
    Number(value ?? "0") || 0;

const resolveOrCreateUser = async (
    email?: string | null,
    name?: string | null
) => {
    if (!email) {
        return null;
    }

    const [existing] = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

    if (existing) {
        return existing;
    }

    const [created] = await db
        .insert(user)
        .values({
            email,
            name: name ?? null,
            emailVerified: false,
        })
        .returning();

    return created ?? null;
};

const createAddress = async (
    userId: string,
    type: "billing" | "shipping",
    details?: {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
        postal_code?: string | null;
    }
) => {
    const [created] = await db
        .insert(addresses)
        .values({
            userId,
            type,
            line1: details?.line1 ?? "Unknown",
            line2: details?.line2 ?? null,
            city: details?.city ?? "Unknown",
            state: details?.state ?? "Unknown",
            country: details?.country ?? "Unknown",
            postalCode: details?.postal_code ?? "00000",
            isDefault: false,
        })
        .returning();

    return created;
};

export const createOrder = async (stripeSessionId: string, userId?: string) => {
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ["line_items", "payment_intent"],
    });

    if (session.payment_status !== "paid") {
        return null;
    }

    const transactionId =
        typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? session.id;

    const [existingPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, transactionId))
        .limit(1);

    if (existingPayment) {
        return existingPayment.orderId;
    }

    const cartId = session.metadata?.cartId;
    if (!cartId) {
        throw new Error("Missing cart metadata.");
    }

    const [cart] = await db
        .select()
        .from(carts)
        .where(eq(carts.id, cartId))
        .limit(1);

    if (!cart) {
        throw new Error("Cart not found.");
    }

    const metadataUserId = session.metadata?.userId?.trim();
    const resolvedUserId =
        userId ??
        (metadataUserId ? metadataUserId : undefined) ??
        (
            await resolveOrCreateUser(
                session.customer_details?.email,
                session.customer_details?.name
            )
        )?.id;

    if (!resolvedUserId) {
        throw new Error("Unable to resolve user for order.");
    }

    const shippingAddress = await createAddress(
        resolvedUserId,
        "shipping",
        (session as any).shipping_details?.address ?? undefined
    );
    const billingAddress = await createAddress(
        resolvedUserId,
        "billing",
        session.customer_details?.address ?? undefined
    );

    const cartRows = await db
        .select({
            variantId: cartItems.productVariantId,
            quantity: cartItems.quantity,
            unitPrice: sql<string>`coalesce(${productVariants.salePrice}, ${productVariants.price})`,
        })
        .from(cartItems)
        .innerJoin(
            productVariants,
            eq(cartItems.productVariantId, productVariants.id)
        )
        .where(eq(cartItems.cartId, cart.id));

    if (cartRows.length === 0) {
        throw new Error("Cart is empty.");
    }

    const totalAmountCents = cartRows.reduce((sum, item) => {
        const unitCents = Math.round(toNumber(item.unitPrice) * 100);
        return sum + unitCents * item.quantity;
    }, 0);

    const [createdOrder] = await db
        .insert(orders)
        .values({
            userId: resolvedUserId,
            status: "paid",
            totalAmount: String(totalAmountCents),
            shippingAddressId: shippingAddress.id,
            billingAddressId: billingAddress.id,
        })
        .returning();

    await db.insert(orderItems).values(
        cartRows.map((item) => ({
            orderId: createdOrder.id,
            productVariantId: item.variantId,
            quantity: item.quantity,
            priceAtPurchase: String(Math.round(toNumber(item.unitPrice) * 100)),
        }))
    );

    await db.insert(payments).values({
        orderId: createdOrder.id,
        method: "stripe",
        status: "completed",
        paidAt: new Date(),
        transactionId,
    });

    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return createdOrder.id;
};

export type OrderDetail = {
    id: string;
    status: string;
    totalAmount: string;
    items: Array<{
        id: string;
        name: string;
        imageUrl: string | null;
        quantity: number;
        price: string;
    }>;
};

export const getOrder = async (
    orderId: string
): Promise<OrderDetail | null> => {
    const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            orderId
        );
    const [order] = isUuid
        ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
        : [undefined];

    let resolvedOrder = order;

    if (!resolvedOrder) {
        let [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.transactionId, orderId))
            .limit(1);

        if (!payment && orderId.startsWith("cs_")) {
            try {
                const session = await stripe.checkout.sessions.retrieve(
                    orderId
                );
                const paymentIntentId =
                    typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id;
                if (paymentIntentId) {
                    [payment] = await db
                        .select()
                        .from(payments)
                        .where(eq(payments.transactionId, paymentIntentId))
                        .limit(1);
                }
            } catch {
                return null;
            }
        }

        if (!payment) {
            return null;
        }

        const [matched] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, payment.orderId))
            .limit(1);

        if (!matched) {
            return null;
        }

        resolvedOrder = matched;
    }

    const variantImage = sql<string | null>`
        (array_agg(${productImages.url}) filter (where ${productImages.variantId} = ${productVariants.id}))[1]
    `;
    const genericImage = sql<string | null>`
        (array_agg(${productImages.url}) filter (where ${productImages.variantId} is null))[1]
    `;
    const imageUrl = sql<
        string | null
    >`coalesce(${variantImage}, ${genericImage})`;

    const rows = await db
        .select({
            id: orderItems.id,
            name: products.name,
            imageUrl,
            quantity: orderItems.quantity,
            price: orderItems.priceAtPurchase,
        })
        .from(orderItems)
        .innerJoin(
            productVariants,
            eq(orderItems.productVariantId, productVariants.id)
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(orderItems.orderId, resolvedOrder.id))
        .groupBy(orderItems.id, products.id, productVariants.id);

    return {
        id: resolvedOrder.id,
        status: resolvedOrder.status,
        totalAmount: (Number(resolvedOrder.totalAmount ?? "0") / 100).toFixed(
            2
        ),
        items: rows.map((row) => ({
            id: row.id,
            name: row.name,
            imageUrl: row.imageUrl,
            quantity: row.quantity,
            price: (Number(row.price ?? "0") / 100).toFixed(2),
        })),
    };
};
