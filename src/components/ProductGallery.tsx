"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Check, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = {
    id: string;
    url: string;
    alt: string;
    variantId?: string;
};

type VariantOption = {
    id: string;
    colorLabel: string;
    colorClass: string;
    images: GalleryImage[];
};

type ProductGalleryProps = {
    variants: VariantOption[];
    selectedVariantId?: string;
    onVariantChange?: (variantId: string) => void;
};

const filterValidImages = (images: GalleryImage[]) =>
    images.filter((image) => image.url);

export default function ProductGallery({
    variants,
    selectedVariantId,
    onVariantChange,
}: ProductGalleryProps) {
    const variantsWithImages = useMemo(
        () =>
            variants.filter(
                (variant) => filterValidImages(variant.images).length > 0
            ),
        [variants]
    );
    const initialVariant = variantsWithImages[0];
    const [internalVariantId, setInternalVariantId] = useState(
        initialVariant?.id ?? ""
    );
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(
        () => new Set()
    );

    const activeVariantId = selectedVariantId ?? internalVariantId;
    const activeVariant = useMemo(
        () =>
            variantsWithImages.find(
                (variant) => variant.id === activeVariantId
            ),
        [variantsWithImages, activeVariantId]
    );

    const activeImages = useMemo(() => {
        const images = filterValidImages(activeVariant?.images ?? []);
        return images.filter((image) => !brokenImages.has(image.id));
    }, [activeVariant, brokenImages]);

    const selectedImage =
        activeImages.find((image) => image.id === selectedImageId) ??
        activeImages[0] ??
        null;

    useEffect(() => {
        if (!selectedVariantId && initialVariant?.id) {
            setInternalVariantId(initialVariant.id);
        }
        if (selectedVariantId) {
            setInternalVariantId(selectedVariantId);
        }
    }, [selectedVariantId, initialVariant?.id]);

    useEffect(() => {
        if (activeImages.length > 0) {
            setSelectedImageId(activeImages[0].id);
        }
    }, [activeVariantId, activeImages]);

    const handleImageError = (imageId: string) => {
        setBrokenImages((prev) => new Set(prev).add(imageId));
    };

    const moveSelection = (direction: "prev" | "next") => {
        if (activeImages.length === 0) {
            return;
        }

        const currentIndex = activeImages.findIndex(
            (image) => image.id === selectedImage?.id
        );
        const nextIndex =
            direction === "next"
                ? (currentIndex + 1) % activeImages.length
                : (currentIndex - 1 + activeImages.length) %
                  activeImages.length;

        setSelectedImageId(activeImages[nextIndex].id);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowRight") {
            moveSelection("next");
        }

        if (event.key === "ArrowLeft") {
            moveSelection("prev");
        }
    };

    return (
        <section
            className="flex flex-col gap-6 lg:flex-row"
            aria-label="Product gallery"
        >
            <div className="hidden lg:flex flex-col gap-3">
                {activeImages.length > 0 ? (
                    activeImages.map((image) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setSelectedImageId(image.id)}
                            className={`relative h-16 w-16 overflow-hidden rounded-lg border ${
                                selectedImage?.id === image.id
                                    ? "border-[var(--color-dark-900)]"
                                    : "border-[var(--color-light-300)]"
                            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dark-900)]`}
                            aria-pressed={selectedImage?.id === image.id}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt}
                                fill
                                className="object-cover"
                                onError={() => handleImageError(image.id)}
                                sizes="64px"
                            />
                        </button>
                    ))
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--color-light-400)] text-[var(--color-dark-500)]">
                        <ImageOff className="h-5 w-5" />
                    </div>
                )}
            </div>

            <div className="flex-1">
                <div
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[var(--color-light-200)]"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {selectedImage ? (
                        <Image
                            src={selectedImage.url}
                            alt={selectedImage.alt}
                            fill
                            priority
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 60vw"
                            onError={() => handleImageError(selectedImage.id)}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-[var(--color-dark-500)]">
                            <div className="h-40 w-40 animate-pulse rounded-2xl bg-[var(--color-light-300)]" />
                            <div className="flex flex-col items-center gap-2 text-center">
                                <ImageOff className="h-8 w-8" />
                                <p className="text-body font-jost">
                                    No images available
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-light-300)] bg-white text-[var(--color-dark-900)]"
                            aria-label="Previous image"
                            onClick={() => moveSelection("prev")}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-light-300)] bg-white text-[var(--color-dark-900)]"
                            aria-label="Next image"
                            onClick={() => moveSelection("next")}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 lg:hidden">
                    {activeImages.length > 0 ? (
                        activeImages.map((image) => (
                            <button
                                key={image.id}
                                type="button"
                                onClick={() => setSelectedImageId(image.id)}
                                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border ${
                                    selectedImage?.id === image.id
                                        ? "border-[var(--color-dark-900)]"
                                        : "border-[var(--color-light-300)]"
                                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dark-900)]`}
                                aria-pressed={selectedImage?.id === image.id}
                            >
                                <Image
                                    src={image.url}
                                    alt={image.alt}
                                    fill
                                    className="object-cover"
                                    onError={() => handleImageError(image.id)}
                                    sizes="64px"
                                />
                            </button>
                        ))
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--color-light-400)] text-[var(--color-dark-500)]">
                            <ImageOff className="h-5 w-5" />
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <p className="text-body font-jost text-[var(--color-dark-700)]">
                        Color
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {variantsWithImages.map((variant) => {
                            const isSelected = variant.id === selectedVariantId;
                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => {
                                        onVariantChange?.(variant.id);
                                        if (!onVariantChange) {
                                            setInternalVariantId(variant.id);
                                        }
                                    }}
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-light-300)] ${variant.colorClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dark-900)]`}
                                    aria-pressed={isSelected}
                                    aria-label={variant.colorLabel}
                                >
                                    {isSelected && (
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                                            <Check className="h-3 w-3 text-[var(--color-dark-900)]" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
