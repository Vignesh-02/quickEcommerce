import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Authentication | Quick Ecommerce",
    description: "Sign in or sign up to continue",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Dark Theme */}
            <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-dark-900)] p-8 lg:p-12 xl:p-16 flex-col justify-between">
                {/* Logo */}
                <div>
                    <Link href="/" aria-label="Home">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-light-100)] rounded-lg mb-8">
                            <Image
                                src="/logo.svg"
                                alt="Nike Logo"
                                width={40}
                                height={29}
                                className="h-6 w-auto brightness-0"
                            />
                        </div>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center">
                    <h1 className="text-heading-2 font-jost text-white mb-6">
                        Just Do It
                    </h1>
                    <p className="text-lead font-jost text-white max-w-md mb-4">
                        Join millions of athletes and fitness enthusiasts who
                        trust Nike for their performance needs.
                    </p>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
                        <span className="w-2 h-2 rounded-full bg-white opacity-50"></span>
                    </div>
                </div>

                {/* Copyright */}
                <div>
                    <p className="text-caption font-jost text-white">
                        © 2024 Nike. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-light-100)]">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
