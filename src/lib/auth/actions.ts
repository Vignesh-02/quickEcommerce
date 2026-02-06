"use server";

import { auth } from "../auth";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { guest } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getCartForUser, mergeGuestCartIntoUserCart } from "@/lib/actions/cart";
import { cookies, headers } from "next/headers";
import { z } from "zod";

// Zod schemas for validation
const signUpSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

// Cookie configuration
const COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Normalize error messages to be more user-friendly
 */
function normalizeErrorMessage(error: string, mode: "sign-in" | "sign-up"): string {
    const lowerError = error.toLowerCase();

    // Common Better Auth error patterns
    if (lowerError.includes("email") && lowerError.includes("already") || lowerError.includes("exists")) {
        return "An account with this email already exists. Please sign in instead.";
    }
    if (lowerError.includes("invalid") && (lowerError.includes("email") || lowerError.includes("password"))) {
        return mode === "sign-in"
            ? "Invalid email or password. Please check your credentials and try again."
            : "Invalid email address. Please enter a valid email.";
    }
    if (lowerError.includes("password") && lowerError.includes("weak") || lowerError.includes("short")) {
        return "Password must be at least 8 characters long.";
    }
    if (lowerError.includes("user not found") || lowerError.includes("no user")) {
        return "No account found with this email. Please sign up first.";
    }
    if (lowerError.includes("network") || lowerError.includes("connection")) {
        return "Network error. Please check your connection and try again.";
    }

    // Return original error if no pattern matches
    return error;
}

/**
 * Create a new user account
 */
export async function signUp(FormData: FormData) {
    try {
        const rawData = {
            name: FormData.get("name") as string,
            email: FormData.get("email") as string,
            password: FormData.get("password") as string,
        };

        // Validate input
        const validated = signUpSchema.parse(rawData);

        // Use Better Auth's signUp method
        const response = await auth.api.signUpEmail({
            body: {
                email: validated.email,
                password: validated.password,
                name: validated.name || "",
            },
            asResponse: true,
        });

        const payload = (await response.json()) as
            | { user: { id: string } }
            | { error: { message: string } };

        if (!response.ok || "error" in payload) {
            const rawError =
                "error" in payload
                    ? payload.error.message
                    : "Failed to create account";
            return {
                success: false,
                error: normalizeErrorMessage(rawError, "sign-up"),
            };
        }

        // Merge guest cart if guest session exists
        const cookieStore = await cookies();
        const guestSessionToken = cookieStore.get("guest_session")?.value;
        if (guestSessionToken) {
            await mergeGuestCartWithUserCart(
                payload.user.id,
                guestSessionToken
            );
        }

        console.info("signUp userId", { userId: payload.user.id });
        return {
            success: true,
            user: payload.user,
            cart: await getCartForUser(payload.user.id),
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid input",
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "An error occurred",
        };
    }
}

/**
 * Sign in an existing user
 */
export async function signIn(FormData: FormData) {
    try {
        const rawData = {
            email: FormData.get("email") as string,
            password: FormData.get("password") as string,
        };
        // Validate input
        const validated = signInSchema.parse(rawData);

        // Use Better Auth's signIn method
        const response = await auth.api.signInEmail({
            body: {
                email: validated.email,
                password: validated.password,
            },
            asResponse: true,
        });

        const payload = (await response.json()) as
            | { user: { id: string } }
            | { error: { message: string } };

        if (!response.ok || "error" in payload) {
            const rawError =
                "error" in payload
                    ? payload.error.message
                    : "Invalid credentials";
            return {
                success: false,
                error: normalizeErrorMessage(rawError, "sign-in"),
            };
        }

        // Merge guest cart if guest session exists
        const cookieStore = await cookies();
        const guestSessionToken = cookieStore.get("guest_session")?.value;
        if (guestSessionToken) {
            await mergeGuestCartWithUserCart(
                payload.user.id,
                guestSessionToken
            );
        }

        console.info("signIn userId", { userId: payload.user.id });
        return {
            success: true,
            user: payload.user,
            cart: await getCartForUser(payload.user.id),
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.issues[0]?.message || "Invalid input",
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "An error occurred",
        };
    }
}

export async function getCurrentUser() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session?.user ?? null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        console.info("signOut start");
        await auth.api.signOut({
            headers: await headers(),
        });
        const cookieStore = await cookies();
        cookieStore.delete("guest_session");
        cookieStore.delete("auth_session");
        cookieStore.delete("better-auth.session_token");

        console.info("signOut completed");
        return {
            success: true,
        };
    } catch (error) {
        console.error("signOut failed", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An error occurred",
        };
    }
}

/**
 * Get or create a guest session
 */
export async function guestSession() {
    try {
        const cookieStore = await cookies();
        const existingToken = cookieStore.get("guest_session")?.value;

        if (existingToken) {
            // Validate existing guest session
            const [guestRecord] = await db
                .select()
                .from(guest)
                .where(
                    and(
                        eq(guest.sessionToken, existingToken),
                        gt(guest.expiresAt, new Date())
                    )
                )
                .limit(1);

            if (guestRecord) {
                return {
                    success: true,
                    sessionToken: existingToken,
                };
            }
        }

        // Create new guest session
        const sessionToken = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.insert(guest).values({
            sessionToken,
            expiresAt,
        });

        // Set cookie
        cookieStore.set("guest_session", sessionToken, COOKIE_CONFIG);

        return {
            success: true,
            sessionToken,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An error occurred",
        };
    }
}

/**
 * Create a new guest session (explicit creation)
 */
export async function createGuestSession() {
    return guestSession();
}

/**
 * Merge guest cart with user cart after login/signup
 */
export async function mergeGuestCartWithUserCart(
    userId: string,
    guestSessionToken: string
) {
    try {
        await mergeGuestCartIntoUserCart(userId, guestSessionToken);

        const cookieStore = await cookies();
        cookieStore.delete("guest_session");

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "An error occurred",
        };
    }
}

/**
 * Get current session (user or guest)
 */
export async function getSession() {
    try {
        // Try to get authenticated user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (session?.user) {
            return {
                user: session.user,
                isAuthenticated: true,
            };
        }

        // Fall back to guest session
        const cookieStore = await cookies();
        const guestSessionToken = cookieStore.get("guest_session")?.value;
        if (guestSessionToken) {
            const [guestRecord] = await db
                .select()
                .from(guest)
                .where(
                    and(
                        eq(guest.sessionToken, guestSessionToken),
                        gt(guest.expiresAt, new Date())
                    )
                )
                .limit(1);

            if (guestRecord) {
                return {
                    guestSessionToken,
                    isAuthenticated: false,
                };
            }
        }

        return {
            isAuthenticated: false,
        };
    } catch (error) {
        return {
            isAuthenticated: false,
            error: error instanceof Error ? error.message : "An error occurred",
        };
    }
}

/**
 * Helper to get headers for Better Auth API calls
 */
