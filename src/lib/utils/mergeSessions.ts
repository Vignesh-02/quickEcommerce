import { cookies } from "next/headers";
import { getSession, mergeGuestCartWithUserCart } from "@/lib/auth/actions";

export const mergeGuestSessionIfNeeded = async () => {
    const session = await getSession();
    if (!session.user?.id) {
        return session;
    }

    const cookieStore = await cookies();
    const guestSessionToken = cookieStore.get("guest_session")?.value;
    if (guestSessionToken) {
        await mergeGuestCartWithUserCart(session.user.id, guestSessionToken);
    }

    return session;
};
