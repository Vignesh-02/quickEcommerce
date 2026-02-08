import { NextResponse } from "next/server";
import { createOrder, getOrder } from "@/lib/actions/orders";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json(
                { error: "Missing session_id parameter" },
                { status: 400 }
            );
        }

        let order = await getOrder(sessionId);

        if (!order) {
            // Webhook may not have run yet. Ensure order exists: create it from the
            // Stripe session if payment is complete (idempotent with webhook).
            const orderId = await createOrder(sessionId);
            if (orderId) {
                order = await getOrder(sessionId);
            }
        }

        if (!order) {
            return NextResponse.json({ order: null }, { status: 200 });
        }

        return NextResponse.json({ order });
    } catch (error) {
        console.error("[API] Error fetching order:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch order",
            },
            { status: 500 }
        );
    }
}
