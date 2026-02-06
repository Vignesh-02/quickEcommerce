"use client";

import { Star } from "lucide-react";
import type { ReviewWithAuthor } from "@/lib/actions/reviews";

type ReviewsListProps = {
    reviews: ReviewWithAuthor[];
};

export default function ReviewsList({ reviews }: ReviewsListProps) {
    if (reviews.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-6 text-center">
                <p className="text-body font-jost text-[var(--color-dark-700)]">
                    No reviews yet. Be the first to review this product!
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="border-b border-[var(--color-light-300)] pb-4 last:border-none last:pb-0"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-body-medium font-jost text-[var(--color-dark-900)]">
                                {review.author.name || review.author.email}
                            </p>
                            <p className="mt-1 text-footnote font-jost text-[var(--color-dark-500)]">
                                {new Date(review.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    }
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                    key={idx}
                                    className={`h-4 w-4 ${
                                        idx < review.rating
                                            ? "fill-[var(--color-dark-900)] text-[var(--color-dark-900)]"
                                            : "text-[var(--color-light-400)]"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="mt-3 text-body font-jost text-[var(--color-dark-700)] whitespace-pre-wrap">
                        {review.comment}
                    </p>
                </div>
            ))}
        </div>
    );
}
