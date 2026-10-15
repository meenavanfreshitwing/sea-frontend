// app/categories/page.tsx
import Link from 'next/link';
import { fetchActiveCategories } from '@/lib/categoryService';
import CategoryCarousel from '@/components/home/Carousal';
import type { Category } from '@/types/category';

export const dynamic = 'force-dynamic';

// Every fish category as tidy tiles (same look as the home page)
export default async function CategoriesPage() {
  const categories = (await fetchActiveCategories().catch(() => [])) as Category[];

  if (categories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-[#315A6E]">No categories yet.</p>
        <Link href="/products" className="mt-4 inline-block rounded-xl bg-[#063B5C] px-6 py-3 font-bold text-white">
          See all fish
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-white">
      <CategoryCarousel displayCategories={categories} showAll />
    </div>
  );
}
