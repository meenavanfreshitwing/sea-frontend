import ProductGrid from '@/components/products/ProductGrid';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  }>;
}

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const selectedCategory = searchParams.category;

  return (
    <div className="min-h-screen bg-white">
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="sr-only">Fresh sea fish from Karaikudi and Pudukkottai</h1>
          <ProductGrid category={selectedCategory} />
        </div>
      </section>
    </div>
  );
}