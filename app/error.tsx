'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

// Shown if a page crashes, instead of a blank screen
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FCFD] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-extrabold text-[#063B5C]">{t('error.title')}</h1>
        <p className="mt-2 text-[#315A6E]">{t('error.text')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#063B5C] px-6 font-bold text-white">
            {t('error.retry')}
          </button>
          <Link href="/" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#063B5C] px-6 font-bold text-[#063B5C]">
            {t('notFound.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
