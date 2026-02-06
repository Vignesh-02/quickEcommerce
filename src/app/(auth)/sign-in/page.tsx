import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";
import AuthForm from "@/components/AuthForm";
import { signIn } from "@/lib/auth/actions";

type SignInPageProps = {
    searchParams: Promise<{ reason?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
    const resolvedParams = await searchParams;
    const showFavoritesNotice = resolvedParams.reason === "favorites";
    const showReviewNotice = resolvedParams.reason === "review";

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                {showFavoritesNotice && (
                    <div className="mb-4 rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-4 text-body font-jost text-[var(--color-dark-700)]">
                        You need to login to add to favourites.
                    </div>
                )}
                {showReviewNotice && (
                    <div className="mb-4 rounded-xl border border-dashed border-[var(--color-light-300)] bg-[var(--color-light-200)] p-4 text-body font-jost text-[var(--color-dark-700)]">
                        You need to login to leave a review.
                    </div>
                )}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-body font-jost text-[var(--color-light-400)]">
                        Already have an account?{" "}
                        <Link
                            href="/sign-in"
                            className="text-[var(--color-dark-900)] underline font-medium"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
                <h1 className="text-heading-2 font-jost text-[var(--color-dark-900)] mb-3">
                    Welcome Back!
                </h1>
                <p className="text-body font-jost text-[var(--color-light-400)]">
                    Sign in to continue your fitness journey
                </p>
            </div>

            {/* Social Providers */}
            <SocialProviders />

            {/* Separator */}
            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[var(--color-light-300)]"></div>
                <span className="text-caption font-jost text-[var(--color-light-400)]">
                    Or sign in with
                </span>
                <div className="flex-1 h-px bg-[var(--color-light-300)]"></div>
            </div>

            {/* Auth Form */}
            <AuthForm mode="sign-in" onSubmit={signIn} />

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-body font-jost text-[var(--color-light-400)]">
                Don&apos;t have an account?{" "}
                <Link
                    href="/sign-up"
                    className="text-[var(--color-dark-900)] underline font-medium"
                >
                    Sign Up
                </Link>
            </p>
        </div>
    );
}
