import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { account } from "./account";
import { addresses } from "./addresses";
import { carts } from "./carts";
import { favorites } from "./favorites";
import { orders } from "./orders";
import { reviews } from "./reviews";
import { session } from "./session";
import { wishlists } from "./wishlists";

export const user = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
    accounts: many(account),
    sessions: many(session),
    addresses: many(addresses),
    orders: many(orders),
    reviews: many(reviews),
    carts: many(carts),
    wishlists: many(wishlists),
    favorites: many(favorites),
}));

export const userInsertSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).nullable().optional(),
    email: z.string().email(),
    emailVerified: z.boolean().optional(),
    image: z.string().url().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const userSelectSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().url().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
