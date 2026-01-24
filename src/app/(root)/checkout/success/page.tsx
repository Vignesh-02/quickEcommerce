import OrderSuccess from "@/components/OrderSuccess";
import { getOrder } from "@/lib/actions/orders";

type CheckoutSuccessPageProps = {
    searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
    searchParams,
}: CheckoutSuccessPageProps) {
    const resolvedParams = await searchParams;
    const sessionId = resolvedParams.session_id;

    if (!sessionId) {
        return (
            <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-10 text-center text-body font-jost text-[var(--color-dark-700)]">
                    Missing checkout session.
                </div>
            </main>
        );
    }

    const order = await getOrder(sessionId);

    if (!order) {
        return (
            <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-10 text-center text-body font-jost text-[var(--color-dark-700)]">
                    We’re finalizing your order. Please refresh in a moment.
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <OrderSuccess order={order} />
        </main>
    );
}
