'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

// Friendly "page not found" (wrong link, or a fish that was removed)
export default function NotFoundClient() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FCFD] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF8FC] text-3xl" aria-hidden="true">🐟</div>
        <h1 className="text-2xl font-extrabold text-[#063B5C]">{t('notFound.title')}</h1>
        <p className="mt-2 text-[#315A6E]">{t('notFound.text')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/products" className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#063B5C] px-6 font-bold text-white">
            {t('hero.shop')}
          </Link>
          <Link href="/" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#063B5C] px-6 font-bold text-[#063B5C]">
            {t('notFound.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
