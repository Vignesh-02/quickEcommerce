"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { OrderDetail } from "@/lib/actions/orders";

type OrderSuccessProps = {
    order: OrderDetail;
};

export default function OrderSuccess({ order }: OrderSuccessProps) {
    return (
        <section className="rounded-2xl border border-[var(--color-light-300)] bg-[var(--color-light-100)] p-6">
            <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-[var(--color-green)]" />
                <h1 className="text-heading-2 font-jost text-[var(--color-dark-900)]">
                    Order confirmed
                </h1>
            </div>
            <p className="mt-2 text-body font-jost text-[var(--color-dark-700)]">
                Thanks for your purchase! Your order is now being processed.
            </p>

            <div className="mt-6 space-y-4">
                {order.items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-xl border border-[var(--color-light-300)] bg-white p-4"
                    >
                        <div className="h-16 w-16 overflow-hidden rounded-xl bg-[var(--color-light-200)]">
                            {item.imageUrl && (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-body-medium font-jost text-[var(--color-dark-900)]">
                                {item.name}
                            </p>
                            <p className="text-footnote font-jost text-[var(--color-dark-500)]">
                                Qty {item.quantity}
                            </p>
                        </div>
                        <p className="text-body font-jost text-[var(--color-dark-900)]">
                            ${item.price}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-body font-jost text-[var(--color-dark-900)]">
                <span>Total</span>
                <span>${order.totalAmount}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <Link
                    href="/products"
                    className="rounded-full bg-[var(--color-dark-900)] px-6 py-3 text-body font-jost text-white"
                >
                    Continue shopping
                </Link>
                <Link
                    href="/"
                    className="rounded-full border border-[var(--color-light-300)] px-6 py-3 text-body font-jost text-[var(--color-dark-900)]"
                >
                    Back to home
                </Link>
            </div>
        </section>
    );
}
