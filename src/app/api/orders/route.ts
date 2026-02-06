import { NextResponse } from "next/server";
import { getOrder } from "@/lib/actions/orders";

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

        console.log("[API] Fetching order for session:", sessionId);
        const order = await getOrder(sessionId);

        if (!order) {
            console.log("[API] Order not found yet for session:", sessionId);
            // Return 200 with order: null to indicate order not found yet (not an error)
            // This allows the client to continue polling
            return NextResponse.json({ order: null }, { status: 200 });
        }

        console.log("[API] Order found:", order.id);
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
