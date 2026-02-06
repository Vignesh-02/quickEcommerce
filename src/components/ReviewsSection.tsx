import CollapsibleSection from "./CollapsibleSection";
import ReviewForm from "./ReviewForm";
import ReviewsList from "./ReviewsList";
import { getProductReviews } from "@/lib/actions/reviews";

type ReviewsSectionProps = {
    productId: string;
};

export default async function ReviewsSection({
    productId,
}: ReviewsSectionProps) {
    const reviews = await getProductReviews(productId);

    return (
        <>
            <CollapsibleSection title={`Reviews (${reviews.length})`}>
                <ReviewsList reviews={reviews} />
            </CollapsibleSection>
            <div className="mt-4">
                <ReviewForm productId={productId} />
            </div>
        </>
    );
}
