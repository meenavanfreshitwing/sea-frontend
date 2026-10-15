'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Category } from '@/types/category';
import { useLanguage } from '@/context/LanguageContext';

interface CategoryCarouselProps {
  displayCategories?: Category[];
  /** Categories page: show every category, no "View all" button, heading as the page title */
  showAll?: boolean;
}

const API_IMG_URL = process.env.NEXT_PUBLIC_IMG_URL;

const imageUrl = (category: Category) => {
  if (!category.image) return '';
  return `${API_IMG_URL}/${category.image.replace(/^\/uploads\//, '')}`;
};

// Collapsed view shows 6 on phones/tablets and 12 on desktop; "View all" opens the rest below.
const PHONE_LIMIT = 6;
const DESKTOP_LIMIT = 12;

// Shop-by-category grid: tidy rows that only grow downwards (no sideways scrolling).
export default function CategoryCarousel({ displayCategories = [], showAll = false }: CategoryCarouselProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>(displayCategories);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(showAll);

  useEffect(() => {
    if (displayCategories.length > 0) {
      setCategories(displayCategories);
      return;
    }
    import('@/lib/categoryService')
      .then(({ fetchActiveCategories }) => fetchActiveCategories())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [displayCategories]);

  if (categories.length === 0) return null;

  const total = categories.length;
  // Visibility per item while collapsed
  const itemClass = (index: number) => {
    if (expanded || index < PHONE_LIMIT) return '';
    if (index < DESKTOP_LIMIT) return 'hidden lg:block';
    return 'hidden';
  };
  // "View all" is needed on phones when > 6, on desktop when > 12
  const toggleClass = showAll ? 'hidden' : total > DESKTOP_LIMIT ? 'flex' : total > PHONE_LIMIT ? 'flex lg:hidden' : 'hidden';

  return (
    <section aria-labelledby="categories-title" className="border-b border-[#E3F1F6] bg-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {showAll ? (
          <h1 id="categories-title" className="mb-5 text-2xl font-extrabold text-[#063B5C] sm:mb-6 sm:text-3xl">
            {t('home.categories')}
          </h1>
        ) : (
          <h2 id="categories-title" className="mb-4 text-xl font-extrabold text-[#063B5C] sm:mb-5 sm:text-2xl">
            {t('home.categories')}
          </h2>
        )}

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
          {categories.map((category, index) => {
            const src = imageUrl(category);
            const showImage = src && !failedImages.has(category._id);
            return (
              <li key={category._id} className={itemClass(index)}>
                <Link
                  href={`/products?category=${category.slug || category._id}`}
                  className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-[#D6ECF3] bg-white p-2.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#008FB8] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008FB8] sm:p-3"
                >
                  <span className="flex aspect-square w-full max-w-[96px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#EAF8FC] to-[#D6ECF3]">
                    {showImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                        onError={() => setFailedImages(prev => new Set(prev).add(category._id))}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-[#063B5C]" aria-hidden="true">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="text-[13px] font-semibold leading-tight text-[#063B5C] group-hover:text-[#008FB8] sm:text-sm">
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={`${toggleClass} mt-4 justify-center`}>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#008FB8] px-5 font-semibold text-[#008FB8] transition hover:bg-[#008FB8] hover:text-white"
          >
            {expanded ? (
              <>
                {t('home.showLess')} <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                {t('home.viewAll', { n: total })} <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
