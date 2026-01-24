type ProductView = {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    imageUrl?: string | null;
    brand?: string | null;
    category?: string | null;
    stock: number;
};

export default async function Home() {
    const productList: ProductView[] = [];

    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    Nike Products
                </h1>

                {productList.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg mb-4">
                            No products found. Please seed the database first.
                        </p>
                        <p className="text-sm text-gray-500">
                            Run:{" "}
                            <code className="bg-gray-200 px-2 py-1 rounded">
                                npm run db:seed
                            </code>
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productList.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {product.imageUrl && (
                                    <div className="aspect-square w-full bg-gray-200 overflow-hidden">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                        {product.name}
                                    </h2>
                                    {product.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {product.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${product.price}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Stock: {product.stock}
                                        </span>
                                    </div>
                                    {product.category && (
                                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                            {product.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
