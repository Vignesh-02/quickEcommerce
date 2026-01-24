import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createOrder } from "@/lib/actions/orders";

export async function POST(request: Request) {
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
        return NextResponse.json(
            { error: "Missing Stripe signature." },
            { status: 400 }
        );
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET ?? ""
        );
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Invalid event" },
            { status: 400 }
        );
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        await createOrder(session.id, session.metadata?.userId || undefined);
    }

    if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.error("Stripe payment failed", intent.id);
    }

    return NextResponse.json({ received: true });
}
