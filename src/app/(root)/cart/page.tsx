import CartClient from "@/components/CartClient";
import { getCart } from "@/lib/actions/cart";

export default async function CartPage() {
    const cart = await getCart();

    return (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <CartClient initialCart={cart} />
        </main>
    );
}
