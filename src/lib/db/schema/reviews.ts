import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { products } from "./products";
import { user } from "./user";

export const reviews = pgTable("reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
    author: one(user, {
        fields: [reviews.userId],
        references: [user.id],
    }),
}));

export const reviewInsertSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid(),
    userId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1),
    createdAt: z.date().optional(),
});

export const reviewSelectSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    userId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string(),
    createdAt: z.date(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
