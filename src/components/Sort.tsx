"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    getQueryString,
    parseQueryString,
    setQueryValue,
    withQuery,
} from "@/lib/utils/query";

const sortOptions = [
    { label: "Featured", value: "featured" },
    { label: "Newest", value: "newest" },
    { label: "Price (High → Low)", value: "price_desc" },
    { label: "Price (Low → High)", value: "price_asc" },
];

export default function Sort() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();

    const currentSort = useMemo(() => {
        const parsed = parseQueryString(search);
        return getQueryString(parsed, "sort") ?? "featured";
    }, [search]);

    const handleChange = (value: string) => {
        let nextSearch = setQueryValue(search, "sort", value);
        nextSearch = setQueryValue(nextSearch, "page", "1");
        router.push(withQuery(pathname, nextSearch), { scroll: false });
    };

    return (
        <div className="flex items-center gap-3">
            <label
                htmlFor="sort"
                className="text-body font-jost text-[var(--color-dark-700)]"
            >
                Sort by
            </label>
            <select
                id="sort"
                value={currentSort}
                onChange={(event) => handleChange(event.target.value)}
                className="rounded-full border border-[var(--color-light-300)] bg-[var(--color-light-100)] px-3 py-2 text-body font-jost text-[var(--color-dark-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dark-900)]"
            >
                {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
