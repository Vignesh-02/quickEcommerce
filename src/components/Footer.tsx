import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    const navigationColumns = [
        {
            title: "Featured",
            links: [
                { label: "Air Force 1", href: "#" },
                { label: "Huarache", href: "#" },
                { label: "Air Max 90", href: "#" },
                { label: "Air Max 95", href: "#" },
            ],
        },
        {
            title: "Shoes",
            links: [
                { label: "All Shoes", href: "#" },
                { label: "Custom Shoes", href: "#" },
                { label: "Jordan Shoes", href: "#" },
                { label: "Running Shoes", href: "#" },
            ],
        },
        {
            title: "Clothing",
            links: [
                { label: "All Clothing", href: "#" },
                { label: "Modest Wear", href: "#" },
                { label: "Hoodies & Pullovers", href: "#" },
                { label: "Shirts & Tops", href: "#" },
            ],
        },
        {
            title: "Kids'",
            links: [
                { label: "Infant & Toddler Shoes", href: "#" },
                { label: "Kids' Shoes", href: "#" },
                { label: "Kids' Jordan Shoes", href: "#" },
                { label: "Kids' Basketball Shoes", href: "#" },
            ],
        },
    ];

    return (
        <footer className="bg-[var(--color-dark-900)] w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
                    {/* Left Section - Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" aria-label="Home">
                            <Image
                                src="/logo.svg"
                                alt="Nike Logo"
                                width={80}
                                height={29}
                                className="h-8 w-auto"
                            />
                        </Link>
                    </div>

                    {/* Middle Section - Navigation Columns */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
                        {navigationColumns.map((column) => (
                            <div
                                key={column.title}
                                className="flex flex-col gap-3"
                            >
                                <h3 className="text-body-medium font-jost text-white mb-1">
                                    {column.title}
                                </h3>
                                <ul className="flex flex-col gap-2">
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href}
                                                className="text-body font-jost text-[var(--color-light-400)] hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Right Section - Social Icons */}
                    <div className="flex items-center gap-4 lg:gap-3">
                        <Link
                            href="#"
                            aria-label="X (Twitter)"
                            className="text-white hover:opacity-70 transition-opacity"
                        >
                            <Image
                                src="/x.svg"
                                alt="X"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                        </Link>
                        <Link
                            href="#"
                            aria-label="Facebook"
                            className="text-white hover:opacity-70 transition-opacity"
                        >
                            <Image
                                src="/facebook.svg"
                                alt="Facebook"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                        </Link>
                        <Link
                            href="#"
                            aria-label="Instagram"
                            className="text-white hover:opacity-70 transition-opacity"
                        >
                            <Image
                                src="/instagram.svg"
                                alt="Instagram"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                        </Link>
                    </div>
                </div>

                {/* Bottom Section - Location, Copyright & Legal Links */}
                <div className="mt-12 pt-8 border-t border-[var(--color-dark-700)]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Left Section - Location & Copyright */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <Image
                                    src="/globe.svg"
                                    alt="Location"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4"
                                />
                                <span className="text-caption font-jost text-[var(--color-light-400)]">
                                    Croatia
                                </span>
                            </div>
                            <span className="text-caption font-jost text-[var(--color-light-400)]">
                                © 2025 Nike, Inc. All Rights Reserved
                            </span>
                        </div>

                        {/* Right Section - Legal Links */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <Link
                                href="#"
                                className="text-caption font-jost text-[var(--color-light-400)] hover:text-white transition-colors"
                            >
                                Guides
                            </Link>
                            <Link
                                href="#"
                                className="text-caption font-jost text-[var(--color-light-400)] hover:text-white transition-colors"
                            >
                                Terms of Sale
                            </Link>
                            <Link
                                href="#"
                                className="text-caption font-jost text-[var(--color-light-400)] hover:text-white transition-colors"
                            >
                                Terms of Use
                            </Link>
                            <Link
                                href="#"
                                className="text-caption font-jost text-[var(--color-light-400)] hover:text-white transition-colors"
                            >
                                Nike Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
