import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";
import { carts } from "./carts";

export const guest = pgTable("guest", {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionToken: text("session_token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // 7 days default
});

export const guestRelations = relations(guest, ({ many }) => ({
    carts: many(carts),
}));

export const guestInsertSchema = z.object({
    id: z.string().uuid().optional(),
    sessionToken: z.string().min(1),
    createdAt: z.date().optional(),
    expiresAt: z.date(),
});

export const guestSelectSchema = z.object({
    id: z.string().uuid(),
    sessionToken: z.string(),
    createdAt: z.date(),
    expiresAt: z.date(),
});

export type Guest = typeof guest.$inferSelect;
export type NewGuest = typeof guest.$inferInsert;
