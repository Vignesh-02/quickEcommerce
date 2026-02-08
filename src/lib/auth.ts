import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "./db/schema";
import { v4 as uuidv4 } from "uuid";
import { nextCookies } from "better-auth/next-js";

const baseURL =
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),
    secret: process.env.BETTER_AUTH_SECRET || "change-this-secret-key",
    baseURL,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // MVP: no verification
    },
    socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {}),
        ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
            ? {
                  facebook: {
                      clientId: process.env.FACEBOOK_CLIENT_ID,
                      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
                  },
              }
            : {}),
    },
    sessions: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },
    cookies: {
        sessionToken: {
            name: "auth_session",
            options: {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict" as const,
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 7 days
            },
        },
    },
    advanced: {
        database: {
            generateId: () => uuidv4(),
        },
    },
    plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
