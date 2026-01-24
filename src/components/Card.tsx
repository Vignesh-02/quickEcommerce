import Image from "next/image";
import Link from "next/link";

export interface CardProps {
    title: string;
    subtitle?: string;
    category?: string;
    meta?: string;
    colorCount?: string;
    price: string;
    imageUrl?: string;
    imageSrc?: string;
    imageAlt?: string;
    badge?: string;
    badgeColor?: "red" | "orange" | "green";
    className?: string;
    href?: string;
}

export default function Card({
    title,
    subtitle,
    category,
    meta,
    colorCount,
    price,
    imageUrl,
    imageSrc,
    imageAlt,
    badge,
    badgeColor = "red",
    className = "",
    href,
}: CardProps) {
    const badgeBgColor =
        {
            red: "bg-[var(--color-red)]",
            orange: "bg-[var(--color-orange)]",
            green: "bg-[var(--color-green)]",
        }[badgeColor] ?? "bg-[var(--color-red)]";

    const displaySubtitle = subtitle ?? category;
    const displayMeta = meta ?? colorCount;
    const resolvedImageSrc = imageUrl ?? imageSrc ?? "/feature.png";
    const formattedPrice = price.startsWith("$") ? price : `$${price}`;

    const containerClasses = `flex flex-col overflow-hidden rounded-lg ${className}`;

    if (href) {
        return (
            <Link href={href} aria-label={title} className={containerClasses}>
                {/* Image Section */}
                <div
                    className={`relative bg-[var(--color-light-200)] aspect-square flex items-center justify-center ${
                        badge ? "pt-12 sm:pt-14 lg:pt-16" : ""
                    } pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8`}
                >
                    {/* Badge */}
                    {badge && (
                        <div
                            className={`absolute top-3 left-3 sm:top-4 sm:left-4 ${badgeBgColor} text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-caption font-jost z-10 whitespace-nowrap`}
                        >
                            {badge}
                        </div>
                    )}

                    {/* Product Image */}
                    <div className="relative w-full h-full">
                        <Image
                            src={resolvedImageSrc}
                            alt={imageAlt || title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-[var(--color-dark-900)] p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left Column - Product Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-body-medium sm:text-lead font-jost text-white mb-1 sm:mb-2 line-clamp-1">
                                {title}
                            </h3>
                            {displaySubtitle && (
                                <p className="text-footnote sm:text-body font-jost text-white mb-1 line-clamp-1">
                                    {displaySubtitle}
                                </p>
                            )}
                            {displayMeta && (
                                <p className="text-footnote sm:text-body font-jost text-white line-clamp-1">
                                    {displayMeta}
                                </p>
                            )}
                        </div>

                        {/* Right Column - Price */}
                        <div className="flex-shrink-0">
                            <p className="text-body-medium sm:text-lead font-jost text-white whitespace-nowrap">
                                {formattedPrice}
                            </p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div className={containerClasses}>
            {/* Image Section */}
            <div
                className={`relative bg-[var(--color-light-200)] aspect-square flex items-center justify-center ${
                    badge ? "pt-12 sm:pt-14 lg:pt-16" : ""
                } pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8`}
            >
                {/* Badge */}
                {badge && (
                    <div
                        className={`absolute top-3 left-3 sm:top-4 sm:left-4 ${badgeBgColor} text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-caption font-jost z-10 whitespace-nowrap`}
                    >
                        {badge}
                    </div>
                )}

                {/* Product Image */}
                <div className="relative w-full h-full">
                    <Image
                        src={resolvedImageSrc}
                        alt={imageAlt || title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-[var(--color-dark-900)] p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    {/* Left Column - Product Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-body-medium sm:text-lead font-jost text-white mb-1 sm:mb-2 line-clamp-1">
                            {title}
                        </h3>
                        {displaySubtitle && (
                            <p className="text-footnote sm:text-body font-jost text-white mb-1 line-clamp-1">
                                {displaySubtitle}
                            </p>
                        )}
                        {displayMeta && (
                            <p className="text-footnote sm:text-body font-jost text-white line-clamp-1">
                                {displayMeta}
                            </p>
                        )}
                    </div>

                    {/* Right Column - Price */}
                    <div className="flex-shrink-0">
                        <p className="text-body-medium sm:text-lead font-jost text-white whitespace-nowrap">
                            {formattedPrice}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
