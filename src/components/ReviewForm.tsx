"use client";

import { useState, useTransition, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
    canUserReviewProduct,
    getUserReviewForProduct,
    createReview,
    updateReview,
    type ReviewWithAuthor,
} from "@/lib/actions/reviews";
import { getCurrentUser } from "@/lib/auth/actions";
import { useRouter } from "next/navigation";

type ReviewFormProps = {
    productId: string;
};

export default function ReviewForm({ productId }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isPending, startTransition] = useTransition();
    const [canReview, setCanReview] = useState<boolean | null>(null);
    const [existingReview, setExistingReview] =
        useState<ReviewWithAuthor | null>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkEligibility = async () => {
            const user = await getCurrentUser();
            if (!user?.id) {
                setIsSignedIn(false);
                setCanReview(false);
                return;
            }

            setIsSignedIn(true);
            console.log("[ReviewForm] Checking eligibility:", {
                userId: user.id,
                productId,
                userEmail: user.email,
            });

            const [hasPurchased, userReview] = await Promise.all([
                canUserReviewProduct(productId, user.id),
                getUserReviewForProduct(productId, user.id),
            ]);

            console.log("[ReviewForm] Eligibility result:", {
                hasPurchased,
                hasExistingReview: !!userReview,
            });

            setCanReview(hasPurchased);
            if (userReview) {
                setExistingReview(userReview);
                setRating(userReview.rating);
                setComment(userReview.comment);
            }
        };

        checkEligibility();
    }, [productId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSignedIn) {
            toast.error("You must be logged in to leave a review");
            router.push("/sign-in?reason=review");
            return;
        }

        if (!canReview) {
            toast.error(
                "You must purchase this product before leaving a review"
            );
            return;
        }

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        if (!comment.trim()) {
            toast.error("Please write a comment");
            return;
        }

        startTransition(async () => {
            try {
                if (existingReview) {
                    const result = await updateReview(
                        existingReview.id,
                        rating,
                        comment
                    );
                    if (result.success && result.review) {
                        toast.success("Review updated successfully");
                        setExistingReview(result.review);
                        router.refresh(); // Refresh to update reviews list
                    } else {
                        toast.error(result.error || "Failed to update review");
                    }
                } else {
                    const result = await createReview(productId, rating, comment);
                    if (result.success && result.review) {
                        toast.success("Review submitted successfully");
                        setExistingReview(result.review);
                        router.refresh(); // Refresh to update reviews list
                    } else {
                        toast.error(result.error || "Failed to submit review");
                    }
                }
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "An error occurred"
                );
            }
        });
    };

    if (canReview === null) {
        return (
            <div className="rounded-xl border border-[var(--color-light-300)] bg-[var(--color-light-100)] p-6">
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-light-300)]" />
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-6 text-center">
                <p className="text-body font-jost text-[var(--color-dark-700)]">
                    Please{" "}
                    <button
                        onClick={() => router.push("/sign-in?reason=review")}
                        className="text-[var(--color-dark-900)] underline"
                    >
                        sign in
                    </button>{" "}
                    to leave a review
                </p>
            </div>
        );
    }

    if (!canReview) {
        return (
            <div className="rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-6 text-center">
                <p className="text-body font-jost text-[var(--color-dark-700)]">
                    You must purchase this product before leaving a review
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--color-light-300)] bg-[var(--color-light-100)] p-6">
            <h3 className="text-heading-4 font-jost text-[var(--color-dark-900)]">
                {existingReview ? "Edit Your Review" : "Write a Review"}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                    <label className="block text-body-medium font-jost text-[var(--color-dark-900)] mb-2">
                        Rating
                    </label>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="focus:outline-none"
                                aria-label={`Rate ${star} stars`}
                            >
                                <Star
                                    className={`h-6 w-6 transition-colors ${
                                        star <= (hoveredRating || rating)
                                            ? "fill-[var(--color-dark-900)] text-[var(--color-dark-900)]"
                                            : "text-[var(--color-light-400)]"
                                    }`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-2 text-body font-jost text-[var(--color-dark-700)]">
                                {rating} {rating === 1 ? "star" : "stars"}
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="comment"
                        className="block text-body-medium font-jost text-[var(--color-dark-900)] mb-2"
                    >
                        Your Review
                    </label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Share your thoughts about this product..."
                        required
                        className="w-full rounded-lg border border-[var(--color-light-300)] px-4 py-3 text-body font-jost text-[var(--color-dark-900)] placeholder:text-[var(--color-light-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-900)] focus:border-transparent resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending || rating === 0 || !comment.trim()}
                    className="rounded-full bg-[var(--color-dark-900)] px-6 py-3 text-body font-jost text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                    {isPending
                        ? "Submitting..."
                        : existingReview
                        ? "Update Review"
                        : "Submit Review"}
                </button>
            </form>
        </div>
    );
}
