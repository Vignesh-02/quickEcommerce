import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const verification = pgTable("verification", {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(), // e.g., email
    value: text("value").notNull(), // token/code to verify
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationInsertSchema = z.object({
    id: z.string().uuid().optional(),
    identifier: z.string().min(1),
    value: z.string().min(1),
    expiresAt: z.date(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const verificationSelectSchema = z.object({
    id: z.string().uuid(),
    identifier: z.string(),
    value: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
