import { Card, Filters, Sort } from "@/components";
import { getAllProducts } from "@/lib/actions/product";
import { parseFilterParams } from "@/lib/utils/query";

const labelMaps = {
    gender: {
        men: "Men",
        women: "Women",
        unisex: "Unisex",
        kids: "Kids",
    },
    color: {
        black: "Black",
        white: "White",
        red: "Red",
        blue: "Blue",
        green: "Green",
        gray: "Gray",
        yellow: "Yellow",
        pink: "Pink",
        navy: "Navy",
        orange: "Orange",
        tan: "Tan",
    },
    size: {
        "6": "6",
        "7": "7",
        "8": "8",
        "9": "9",
        "10": "10",
        "11": "11",
        "12": "12",
    },
    price: {
        "0-50": "$0 - $50",
        "50-100": "$50 - $100",
        "100-150": "$100 - $150",
        "150-999": "$150+",
    },
};

export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
    const filters = parseFilterParams(resolvedSearchParams);
    const { products, totalCount } = await getAllProducts(filters);

    const activeBadges = [
        ...filters.genders.map(
            (value) => labelMaps.gender[value as keyof typeof labelMaps.gender]
        ),
        ...filters.sizes.map(
            (value) =>
                `Size: ${labelMaps.size[value as keyof typeof labelMaps.size]}`
        ),
        ...filters.colors.map(
            (value) =>
                `Color: ${
                    labelMaps.color[value as keyof typeof labelMaps.color]
                }`
        ),
        ...filters.priceRanges.map(
            (range) =>
                labelMaps.price[
                    `${range.min}-${range.max}` as keyof typeof labelMaps.price
                ]
        ),
    ].filter(Boolean);

    return (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-heading-2 font-jost text-[var(--color-dark-900)]">
                        New ({totalCount})
                    </h1>
                    <p className="text-body font-jost text-[var(--color-dark-700)]">
                        Fresh arrivals curated for your stride.
                    </p>
                </div>
                <Sort />
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                <Filters />

                <section className="flex-1">
                    {activeBadges.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            {activeBadges.map((badge) => (
                                <span
                                    key={badge}
                                    className="rounded-full border border-[var(--color-light-300)] bg-[var(--color-light-100)] px-3 py-1 text-footnote font-jost text-[var(--color-dark-700)]"
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}

                    {products.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--color-light-400)] bg-[var(--color-light-200)] p-10 text-center">
                            <h2 className="text-heading-3 font-jost text-[var(--color-dark-900)]">
                                No matches found
                            </h2>
                            <p className="mt-2 text-body font-jost text-[var(--color-dark-700)]">
                                Try adjusting your filters to see more products.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {products.map((product) => {
                                const metaParts: string[] = [];

                                if (filters.colors.length > 0) {
                                    metaParts.push(
                                        `Color: ${filters.colors
                                            .map(
                                                (value) =>
                                                    labelMaps.color[
                                                        value as keyof typeof labelMaps.color
                                                    ] ?? value
                                            )
                                            .join(", ")}`
                                    );
                                }

                                if (filters.sizes.length > 0) {
                                    metaParts.push(
                                        `Size: ${filters.sizes.join(", ")}`
                                    );
                                }

                                if (metaParts.length === 0) {
                                    metaParts.push(
                                        `${product.colorCount} Colours`
                                    );
                                }

                                const rawPrice =
                                    product.minPrice ?? product.maxPrice ?? "0";
                                const price = Number(rawPrice).toFixed(2);

                                return (
                                    <Card
                                        key={product.id}
                                        title={product.name}
                                        subtitle={
                                            product.categoryName ??
                                            product.genderLabel ??
                                            "Nike"
                                        }
                                        meta={metaParts.join(" · ")}
                                        price={price}
                                        imageSrc={
                                            product.imageUrls[0] ??
                                            "/feature.png"
                                        }
                                        href={`/products/${product.id}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
