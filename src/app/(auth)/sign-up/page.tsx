import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";
import AuthForm from "@/components/AuthForm";
import { signUp } from "@/lib/auth/actions";

export default function SignUpPage() {
    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
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
                    Join Nike Today!
                </h1>
                <p className="text-body font-jost text-[var(--color-light-400)]">
                    Create your account to start your fitness journey
                </p>
            </div>

            {/* Social Providers */}
            <SocialProviders />

            {/* Separator */}
            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[var(--color-light-300)]"></div>
                <span className="text-caption font-jost text-[var(--color-light-400)]">
                    Or sign up with
                </span>
                <div className="flex-1 h-px bg-[var(--color-light-300)]"></div>
            </div>

            {/* Auth Form */}
            <AuthForm mode="sign-up" onSubmit={signUp}/>
        </div>
    );
}
