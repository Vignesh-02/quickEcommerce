import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { user } from "./user";

export const session = pgTable("session", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const sessionInsertSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    token: z.string().min(1),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    expiresAt: z.date(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const sessionSelectSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    token: z.string(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    expiresAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
