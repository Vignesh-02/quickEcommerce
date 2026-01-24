import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/actions/product";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() ?? "";

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    const { products } = await getAllProducts({
        search: query,
        limit: 6,
        page: 1,
    });

    const results = products.map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.minPrice ?? product.maxPrice ?? "0").toFixed(2),
        imageUrl: product.imageUrls[0] ?? "/feature.png",
    }));

    return NextResponse.json({ results });
}
