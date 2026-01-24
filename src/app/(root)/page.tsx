import { Card } from "@/components";
import { getAllProducts } from "@/lib/actions/product";

const Home = async () => {
    const { products } = await getAllProducts({ limit: 6 });

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <section aria-labelledby="latest" className="pb-12">
                <h2 id="latest" className="mb-6 text-heading-3 text-dark-900">
                    Latest shoes
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => {
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
                                meta={`${product.colorCount} Colours`}
                                price={price}
                                imageSrc={
                                    product.imageUrls[0] ?? "/feature.png"
                                }
                                href={`/products/${product.id}`}
                            />
                        );
                    })}
                </div>
            </section>
        </main>
    );
};

export default Home;
