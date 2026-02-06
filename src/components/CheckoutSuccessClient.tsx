"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import OrderSuccess from "./OrderSuccess";
import type { OrderDetail } from "@/lib/actions/orders";

type CheckoutSuccessClientProps = {
    sessionId: string;
};

export default function CheckoutSuccessClient({
    sessionId,
}: CheckoutSuccessClientProps) {
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pollCountRef = useRef(0);
    const isPollingRef = useRef(true);

    useEffect(() => {
        const maxPolls = 30; // Poll for up to 30 seconds (30 * 1s intervals)
        const pollInterval = 1000; // Poll every 1 second

        const pollForOrder = async () => {
            if (!isPollingRef.current) {
                return;
            }

            try {
                const response = await fetch(
                    `/api/orders?session_id=${encodeURIComponent(sessionId)}`
                );

                if (!response.ok) {
                    // If it's a server error (500), throw immediately
                    if (response.status >= 500) {
                        throw new Error("Server error while fetching order");
                    }
                    // For other errors, continue polling if we haven't reached max polls
                    if (pollCountRef.current < maxPolls) {
                        pollCountRef.current++;
                        return;
                    }
                    throw new Error("Failed to fetch order");
                }

                const data = await response.json();
                
                // Check if order exists
                if (data.order) {
                    setOrder(data.order);
                    setIsLoading(false);
                    isPollingRef.current = false;
                    return;
                }

                // Order not found yet - continue polling if we haven't reached max polls
                if (pollCountRef.current < maxPolls) {
                    pollCountRef.current++;
                } else {
                    setError("Order processing is taking longer than expected. Please refresh the page.");
                    setIsLoading(false);
                    isPollingRef.current = false;
                }
            } catch (err) {
                // Only stop polling on non-recoverable errors or after max polls
                if (pollCountRef.current < maxPolls && err instanceof Error && !err.message.includes("Server error")) {
                    pollCountRef.current++;
                } else {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load order details"
                    );
                    setIsLoading(false);
                    isPollingRef.current = false;
                }
            }
        };

        // Start polling immediately
        pollForOrder();

        // Set up interval polling
        const intervalId = setInterval(() => {
            if (!isPollingRef.current || pollCountRef.current >= maxPolls) {
                clearInterval(intervalId);
                return;
            }
            pollForOrder();
        }, pollInterval);

        // Cleanup on unmount
        return () => {
            isPollingRef.current = false;
            clearInterval(intervalId);
        };
    }, [sessionId]);

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-10 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-light-300)] border-t-[var(--color-dark-900)]"></div>
                    <p className="text-body font-jost text-[var(--color-dark-700)]">
                        We&apos;re finalizing your order. This will only take a moment...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-10 text-center">
                <p className="text-body font-jost text-[var(--color-dark-700)]">
                    {error}
                </p>
                <button
                    onClick={() => router.refresh()}
                    className="mt-4 rounded-full bg-[var(--color-dark-900)] px-6 py-3 text-body font-jost text-white"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="rounded-2xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-10 text-center">
                <p className="text-body font-jost text-[var(--color-dark-700)]">
                    Order not found. Please contact support if this issue persists.
                </p>
            </div>
        );
    }

    return <OrderSuccess order={order} />;
}
