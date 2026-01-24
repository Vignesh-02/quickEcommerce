"use client";

import { useState } from "react";

type SizeOption = {
    label: string;
    value: string;
    disabled?: boolean;
};

type SizePickerProps = {
    sizes: SizeOption[];
    selectedSize?: string;
    onSelect?: (value: string) => void;
};

export default function SizePicker({
    sizes,
    selectedSize,
    onSelect,
}: SizePickerProps) {
    const [internalSelected, setInternalSelected] = useState<string | null>(
        null
    );
    const resolvedSelected = selectedSize ?? internalSelected;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-body-medium font-jost text-[var(--color-dark-900)]">
                    Select Size
                </p>
                <button
                    type="button"
                    className="text-body font-jost text-[var(--color-dark-700)] underline underline-offset-4"
                >
                    Size Guide
                </button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {sizes.map((size) => {
                    const isSelected = resolvedSelected === size.value;
                    return (
                        <button
                            key={size.value}
                            type="button"
                            disabled={size.disabled}
                            onClick={() => {
                                onSelect?.(size.value);
                                if (!onSelect) {
                                    setInternalSelected(size.value);
                                }
                            }}
                            className={`rounded-lg border px-3 py-2 text-body font-jost transition ${
                                size.disabled
                                    ? "cursor-not-allowed border-[var(--color-light-300)] bg-[var(--color-light-200)] text-[var(--color-dark-500)]"
                                    : isSelected
                                    ? "border-[var(--color-dark-900)] bg-[var(--color-dark-900)] text-white"
                                    : "border-[var(--color-light-300)] bg-white text-[var(--color-dark-900)] hover:border-[var(--color-dark-900)]"
                            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dark-900)]`}
                            aria-pressed={isSelected}
                        >
                            {size.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
