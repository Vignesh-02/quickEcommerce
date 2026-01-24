"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type CollapsibleSectionProps = {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
};

export default function CollapsibleSection({
    title,
    children,
    defaultOpen = false,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[var(--color-light-300)] py-4">
            <button
                type="button"
                className="flex w-full items-center justify-between text-left text-body-medium font-jost text-[var(--color-dark-900)]"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
            >
                {title}
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>
            {isOpen && (
                <div className="mt-4 text-body font-jost text-[var(--color-dark-700)]">
                    {children}
                </div>
            )}
        </div>
    );
}
