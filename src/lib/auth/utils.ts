import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { guest } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * Cookie configuration for guest sessions
 */
export const GUEST_COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Get the current guest session token from cookies
 */
export async function getGuestSessionToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get("guest_session")?.value || null;
}

/**
 * Validate a guest session token
 */
export async function validateGuestSession(
    sessionToken: string
): Promise<boolean> {
    try {
        const [guestRecord] = await db
            .select()
            .from(guest)
            .where(
                and(
                    eq(guest.sessionToken, sessionToken),
                    gt(guest.expiresAt, new Date())
                )
            )
            .limit(1);

        return !!guestRecord;
    } catch {
        return false;
    }
}

/**
 * Delete a guest session
 */
export async function deleteGuestSession(sessionToken: string): Promise<void> {
    try {
        await db.delete(guest).where(eq(guest.sessionToken, sessionToken));
        const cookieStore = await cookies();
        cookieStore.delete("guest_session");
    } catch (error) {
        console.error("Error deleting guest session:", error);
    }
}
