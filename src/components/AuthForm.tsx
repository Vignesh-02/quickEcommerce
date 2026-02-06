"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCart } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";

type AuthActionResult = {
    success: boolean;
    error?: string;
    user?: { id: string };
    cart?: import("@/lib/actions/cart").CartSummary;
} | void;

interface AuthFormProps {
    mode: "sign-in" | "sign-up";
    onSubmit?: (data: FormData) => Promise<AuthActionResult>;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isSignUp = mode === "sign-up";

    const router = useRouter();
    const setCart = useCartStore((state) => state.setCart);
    const setLoading = useCartStore((state) => state.setLoading);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            if (onSubmit) {
                // calls the action function from the parent component with FormData
                const result = await onSubmit(formData);
                if (result && "success" in result && result.success) {
                    toast.success(
                        mode === "sign-up"
                            ? "Account created successfully!"
                            : "Signed in successfully!"
                    );
                    setLoading(true);
                    if (result.cart) {
                        setCart(result.cart);
                    } else {
                        try {
                            const cart = await getCart({ createGuest: false });
                            setCart(cart);
                        } catch (cartError) {
                            console.log(cartError);
                        }
                    }
                    router.push("/");
                } else {
                    const errorMessage =
                        result && "error" in result
                            ? result.error
                            : "An unexpected error occurred";
                    toast.error(errorMessage || "Failed to authenticate");
                }
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            toast.error(errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name - Only for Sign Up */}
            {isSignUp && (
                <div>
                    <label
                        htmlFor="name"
                        className="block text-body-medium font-jost text-[var(--color-dark-900)] mb-2"
                    >
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter your name"
                        required={isSignUp}
                        className="w-full px-4 py-3 border border-[var(--color-light-300)] rounded-lg text-body font-jost text-[var(--color-dark-900)] placeholder:text-[var(--color-light-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-900)] focus:border-transparent"
                    />
                </div>
            )}

            {/* Email */}
            <div>
                <label
                    htmlFor="email"
                    className="block text-body-medium font-jost text-[var(--color-dark-900)] mb-2"
                >
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="johndoe@gmail.com"
                    required
                    className="w-full px-4 py-3 border border-[var(--color-light-300)] rounded-lg text-body font-jost text-[var(--color-dark-900)] placeholder:text-[var(--color-light-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-900)] focus:border-transparent"
                />
            </div>

            {/* Password */}
            <div>
                <label
                    htmlFor="password"
                    className="block text-body-medium font-jost text-[var(--color-dark-900)] mb-2"
                >
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder={
                            isSignUp
                                ? "minimum 8 characters"
                                : "Enter your password"
                        }
                        required
                        minLength={isSignUp ? 8 : undefined}
                        className="w-full px-4 py-3 pr-12 border border-[var(--color-light-300)] rounded-lg text-body font-jost text-[var(--color-dark-900)] placeholder:text-[var(--color-light-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-900)] focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-light-400)] hover:text-[var(--color-dark-900)] transition-colors"
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {showPassword ? (
                                <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </>
                            ) : (
                                <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full py-3 bg-[var(--color-dark-900)] text-white text-body-medium font-jost rounded-lg hover:opacity-90 transition-opacity"
            >
                {isSignUp ? "Sign Up" : "Sign In"}
            </button>

            {/* Terms - Only for Sign Up */}
            {isSignUp && (
                <p className="text-footnote font-jost text-[var(--color-light-400)] text-center">
                    By signing up, you agree to our{" "}
                    <Link
                        href="#"
                        className="text-[var(--color-dark-900)] underline hover:opacity-70"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="#"
                        className="text-[var(--color-dark-900)] underline hover:opacity-70"
                    >
                        Privacy Policy
                    </Link>
                </p>
            )}
        </form>
    );
}
