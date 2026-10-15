'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import { getAllProducts } from '@/lib/productService';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types/product';

// A fish is "on offer" when its default pack (or the fish itself) has a higher original price
const isOnOffer = (p: Product) => {
  const v = p.variants?.find(x => x.isDefault) || p.variants?.[0];
  if (v) return Number(v.originalPrice || 0) > Number(v.price || 0);
  return Boolean(p.originalPrice && Number(p.originalPrice) > Number(p.basePrice || 0));
};

export default function OffersClient() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    getAllProducts({})
      .then(res => setItems(((res.data || []) as Product[]).filter(isOnOffer)))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="min-h-[60vh] bg-[#F8FCFD] py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-[#063B5C] sm:text-3xl">{t('offers.title')}</h1>
          <p className="mt-2 text-[#315A6E]">{t('offers.sub')}</p>
        </div>

        {items === null ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#008FB8]" />
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-[#B8DCE7] bg-white p-8 text-center">
            <p className="text-[#315A6E]">{t('offers.none')}</p>
            <Link href="/products" className="mt-5 inline-flex min-h-[48px] items-center rounded-xl bg-[#063B5C] px-6 font-bold text-white">
              {t('hero.shop')} →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {items.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
