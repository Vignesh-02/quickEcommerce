"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    orderItems,
    orders,
    productVariants,
    reviews,
    user,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { reviewInsertSchema } from "@/lib/db/schema/reviews";

export type ReviewWithAuthor = {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    author: {
        id: string;
        name: string | null;
        email: string;
    };
};

/**
 * Check if a user has purchased any variant of a product
 * Only counts orders with status: 'paid', 'shipped', or 'delivered'
 */
export async function canUserReviewProduct(
    productId: string,
    userId: string
): Promise<boolean> {
    try {
        // Check if there are any orders for this user and product
        const purchaseCheck = await db
            .select({
                orderId: orders.id,
                orderStatus: orders.status,
                variantId: productVariants.id,
                productId: productVariants.productId,
            })
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .innerJoin(
                productVariants,
                eq(orderItems.productVariantId, productVariants.id)
            )
            .where(
                and(
                    eq(orders.userId, userId),
                    eq(productVariants.productId, productId),
                    inArray(orders.status, ["paid", "shipped", "delivered"])
                )
            )
            .limit(1);

        const hasPurchased = purchaseCheck.length > 0;

        // Debug logging
        if (!hasPurchased) {
            console.log("[canUserReviewProduct] No purchase found:", {
                userId,
                productId,
                foundOrders: purchaseCheck.length,
            });

            // Let's also check what orders exist for this user (for debugging)
            const allUserOrders = await db
                .select({
                    orderId: orders.id,
                    orderStatus: orders.status,
                })
                .from(orders)
                .where(eq(orders.userId, userId))
                .limit(5);

            console.log("[canUserReviewProduct] User's orders:", allUserOrders);

            // Check if there are any order items for this product (regardless of order status)
            const productOrderItems = await db
                .select({
                    orderId: orders.id,
                    orderStatus: orders.status,
                    variantId: productVariants.id,
                })
                .from(orders)
                .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
                .innerJoin(
                    productVariants,
                    eq(orderItems.productVariantId, productVariants.id)
                )
                .where(
                    and(
                        eq(orders.userId, userId),
                        eq(productVariants.productId, productId)
                    )
                )
                .limit(5);

            console.log(
                "[canUserReviewProduct] Product order items (all statuses):",
                productOrderItems
            );
        } else {
            console.log("[canUserReviewProduct] Purchase found:", {
                userId,
                productId,
                orderId: purchaseCheck[0]?.orderId,
                orderStatus: purchaseCheck[0]?.orderStatus,
            });
        }

        return hasPurchased;
    } catch (error) {
        console.error("Error checking purchase eligibility:", error);
        return false;
    }
}

/**
 * Get user's existing review for a product (if any)
 */
export async function getUserReviewForProduct(
    productId: string,
    userId: string
): Promise<ReviewWithAuthor | null> {
    try {
        const [review] = await db
            .select({
                id: reviews.id,
                productId: reviews.productId,
                userId: reviews.userId,
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            })
            .from(reviews)
            .innerJoin(user, eq(reviews.userId, user.id))
            .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
            .limit(1);

        return review ?? null;
    } catch (error) {
        console.error("Error fetching user review:", error);
        return null;
    }
}

/**
 * Create a new review for a product
 * Validates that user has purchased the product and hasn't already reviewed it
 */
export async function createReview(
    productId: string,
    rating: number,
    comment: string
): Promise<{ success: boolean; review?: ReviewWithAuthor; error?: string }> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return {
                success: false,
                error: "You must be logged in to leave a review",
            };
        }

        const userId = currentUser.id;

        // Check if user has purchased the product
        const hasPurchased = await canUserReviewProduct(productId, userId);
        if (!hasPurchased) {
            return {
                success: false,
                error: "You must purchase this product before leaving a review",
            };
        }

        // Check if user already has a review
        const existingReview = await getUserReviewForProduct(productId, userId);
        if (existingReview) {
            return {
                success: false,
                error: "You have already reviewed this product. Please update your existing review instead.",
            };
        }

        // Validate input
        const validated = reviewInsertSchema.parse({
            productId,
            userId,
            rating,
            comment,
        });

        // Create review
        const [newReview] = await db
            .insert(reviews)
            .values(validated)
            .returning();

        // Fetch the review with author info
        const [reviewWithAuthor] = await db
            .select({
                id: reviews.id,
                productId: reviews.productId,
                userId: reviews.userId,
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            })
            .from(reviews)
            .innerJoin(user, eq(reviews.userId, user.id))
            .where(eq(reviews.id, newReview.id))
            .limit(1);

        return {
            success: true,
            review: reviewWithAuthor ?? undefined,
        };
    } catch (error) {
        if (error instanceof Error && error.message.includes("unique")) {
            return {
                success: false,
                error: "You have already reviewed this product",
            };
        }

        console.error("Error creating review:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create review",
        };
    }
}

/**
 * Update an existing review
 */
export async function updateReview(
    reviewId: string,
    rating: number,
    comment: string
): Promise<{ success: boolean; review?: ReviewWithAuthor; error?: string }> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return {
                success: false,
                error: "You must be logged in to update a review",
            };
        }

        const userId = currentUser.id;

        // Check if review exists and belongs to user
        const [existingReview] = await db
            .select()
            .from(reviews)
            .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
            .limit(1);

        if (!existingReview) {
            return {
                success: false,
                error: "Review not found or you don't have permission to update it",
            };
        }

        // Validate input
        const validated = reviewInsertSchema.pick({
            rating: true,
            comment: true,
        }).parse({ rating, comment });

        // Update review
        const [updatedReview] = await db
            .update(reviews)
            .set({
                rating: validated.rating,
                comment: validated.comment,
            })
            .where(eq(reviews.id, reviewId))
            .returning();

        // Fetch the review with author info
        const [reviewWithAuthor] = await db
            .select({
                id: reviews.id,
                productId: reviews.productId,
                userId: reviews.userId,
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            })
            .from(reviews)
            .innerJoin(user, eq(reviews.userId, user.id))
            .where(eq(reviews.id, updatedReview.id))
            .limit(1);

        return {
            success: true,
            review: reviewWithAuthor ?? undefined,
        };
    } catch (error) {
        console.error("Error updating review:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update review",
        };
    }
}

/**
 * Get all reviews for a product with author information
 */
export async function getProductReviews(
    productId: string
): Promise<ReviewWithAuthor[]> {
    try {
        const results = await db
            .select({
                id: reviews.id,
                productId: reviews.productId,
                userId: reviews.userId,
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            })
            .from(reviews)
            .innerJoin(user, eq(reviews.userId, user.id))
            .where(eq(reviews.productId, productId))
            .orderBy(desc(reviews.createdAt));

        return results;
    } catch (error) {
        console.error("Error fetching product reviews:", error);
        return [];
    }
}

/**
 * Get review statistics for a product (average rating, total count)
 */
export async function getProductReviewStats(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}> {
    try {
        // Get average rating and total count
        const stats = await db
            .select({
                averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
                totalReviews: sql<number>`count(*)`,
            })
            .from(reviews)
            .where(eq(reviews.productId, productId));

        const result = stats[0];

        if (!result || Number(result.totalReviews) === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: {},
            };
        }

        // Get rating distribution separately
        const distributionRows = await db
            .select({
                rating: reviews.rating,
                count: sql<number>`count(*)`,
            })
            .from(reviews)
            .where(eq(reviews.productId, productId))
            .groupBy(reviews.rating);

        // Build rating distribution object
        const distribution: Record<number, number> = {};
        distributionRows.forEach((row) => {
            distribution[row.rating] = Number(row.count);
        });

        return {
            averageRating: Number(result.averageRating) || 0,
            totalReviews: Number(result.totalReviews) || 0,
            ratingDistribution: distribution,
        };
    } catch (error) {
        console.error("Error fetching review stats:", error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: {},
        };
    }
}
