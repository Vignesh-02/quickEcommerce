"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    getQueryArray,
    parseQueryString,
    toggleQueryValue,
    withQuery,
} from "@/lib/utils/query";

type FilterOption = {
    label: string;
    value: string;
};

type FilterGroup = {
    id: "gender" | "size" | "color" | "price";
    label: string;
    options: FilterOption[];
};

const filterGroups: FilterGroup[] = [
    {
        id: "gender",
        label: "Gender",
        options: [
            { label: "Men", value: "men" },
            { label: "Women", value: "women" },
            { label: "Unisex", value: "unisex" },
            { label: "Kids", value: "kids" },
        ],
    },
    {
        id: "size",
        label: "Size",
        options: [
            { label: "6", value: "6" },
            { label: "7", value: "7" },
            { label: "8", value: "8" },
            { label: "9", value: "9" },
            { label: "10", value: "10" },
            { label: "11", value: "11" },
            { label: "12", value: "12" },
        ],
    },
    {
        id: "color",
        label: "Color",
        options: [
            { label: "Black", value: "black" },
            { label: "White", value: "white" },
            { label: "Red", value: "red" },
            { label: "Blue", value: "blue" },
            { label: "Green", value: "green" },
            { label: "Gray", value: "gray" },
            { label: "Yellow", value: "yellow" },
            { label: "Pink", value: "pink" },
            { label: "Orange", value: "orange" },
            { label: "Navy", value: "navy" },
            { label: "Tan", value: "tan" },
        ],
    },
    {
        id: "price",
        label: "Price Range",
        options: [
            { label: "$0 - $50", value: "0-50" },
            { label: "$50 - $100", value: "50-100" },
            { label: "$100 - $150", value: "100-150" },
            { label: "$150+", value: "150-999" },
        ],
    },
];

const defaultOpenState = filterGroups.reduce(
    (acc, group) => ({ ...acc, [group.id]: true }),
    {} as Record<string, boolean>
);

export default function Filters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [openSections, setOpenSections] = useState(defaultOpenState);

    const search = searchParams.toString();
    const parsed = useMemo(() => parseQueryString(search), [search]);

    const activeSelections = useMemo(
        () => ({
            gender: getQueryArray(parsed, "gender"),
            size: getQueryArray(parsed, "size"),
            color: getQueryArray(parsed, "color"),
            price: getQueryArray(parsed, "price"),
        }),
        [parsed]
    );

    const toggleFilter = (groupId: FilterGroup["id"], value: string) => {
        const nextSearch = toggleQueryValue(search, groupId, value);
        router.push(withQuery(pathname, nextSearch), { scroll: false });
    };

    const toggleSection = (id: string) => {
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderGroup = (group: FilterGroup) => {
        const isOpen = openSections[group.id];
        const selections = activeSelections[group.id];

        return (
            <div
                key={group.id}
                className="border-b border-[var(--color-light-300)] py-4"
            >
                <button
                    type="button"
                    className="flex w-full items-center justify-between text-body-medium font-jost text-[var(--color-dark-900)]"
                    onClick={() => toggleSection(group.id)}
                    aria-expanded={isOpen}
                    aria-controls={`${group.id}-options`}
                >
                    {group.label}
                    <span
                        className={`text-body text-[var(--color-dark-700)] transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>
                <div
                    id={`${group.id}-options`}
                    className={`${isOpen ? "mt-4" : "mt-0 hidden"}`}
                >
                    <fieldset className="flex flex-col gap-3">
                        <legend className="sr-only">{group.label}</legend>
                        {group.options.map((option) => {
                            const checked = selections.includes(option.value);
                            return (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-3 text-body font-jost text-[var(--color-dark-900)]"
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-[var(--color-light-400)] text-[var(--color-dark-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dark-900)]"
                                        checked={checked}
                                        onChange={() =>
                                            toggleFilter(group.id, option.value)
                                        }
                                    />
                                    <span>{option.label}</span>
                                </label>
                            );
                        })}
                    </fieldset>
                </div>
            </div>
        );
    };

    const activeCount =
        activeSelections.gender.length +
        activeSelections.size.length +
        activeSelections.color.length +
        activeSelections.price.length;

    return (
        <>
            <div className="flex items-center justify-between lg:hidden">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-light-300)] px-4 py-2 text-body font-jost text-[var(--color-dark-900)]"
                    onClick={() => setIsDrawerOpen(true)}
                >
                    Filters
                    {activeCount > 0 && (
                        <span className="rounded-full bg-[var(--color-dark-900)] px-2 py-0.5 text-footnote text-white">
                            {activeCount}
                        </span>
                    )}
                </button>
            </div>

            <aside className="hidden lg:block w-full max-w-xs">
                <div className="rounded-lg border border-[var(--color-light-300)] bg-[var(--color-light-100)] px-4">
                    {filterGroups.map(renderGroup)}
                </div>
            </aside>

            {isDrawerOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsDrawerOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-[var(--color-light-100)] shadow-xl">
                        <div className="flex items-center justify-between border-b border-[var(--color-light-300)] px-4 py-4">
                            <h2 className="text-heading-3 font-jost text-[var(--color-dark-900)]">
                                Filters
                            </h2>
                            <button
                                type="button"
                                className="text-body font-jost text-[var(--color-dark-700)]"
                                onClick={() => setIsDrawerOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                        <div className="px-4">
                            {filterGroups.map(renderGroup)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
