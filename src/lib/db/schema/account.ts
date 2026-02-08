import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { user } from "./user";

export const account = pgTable("account", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(), // e.g., "credentials", "google", "facebook"
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"), // For credentials provider (hashed)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const accountInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    accountId: z.string().min(1),
    providerId: z.string().min(1),
    accessToken: z.string().nullable().optional(),
    refreshToken: z.string().nullable().optional(),
    accessTokenExpiresAt: z.date().nullable().optional(),
    refreshTokenExpiresAt: z.date().nullable().optional(),
    scope: z.string().nullable().optional(),
    idToken: z.string().nullable().optional(),
    password: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const accountSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    accountId: z.string(),
    providerId: z.string(),
    accessToken: z.string().nullable(),
    refreshToken: z.string().nullable(),
    accessTokenExpiresAt: z.date().nullable(),
    refreshTokenExpiresAt: z.date().nullable(),
    scope: z.string().nullable(),
    idToken: z.string().nullable(),
    password: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
