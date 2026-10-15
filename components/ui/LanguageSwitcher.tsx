'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// "English | தமிழ்" toggle. `compact` is used in the mobile header.
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();

  const option = (value: 'en' | 'ta', label: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      lang={value}
      className={`rounded-full font-semibold transition-colors ${
        compact ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'
      } ${
        lang === value ? 'bg-[#063B5C] text-white shadow-sm' : 'text-[#063B5C] hover:bg-[#EAF8FC]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-[#B8DCE7] bg-white p-0.5"
      role="group"
      aria-label="Language / மொழி"
    >
      {!compact && <Languages className="ml-2 h-4 w-4 text-[#008FB8]" aria-hidden="true" />}
      {option('en', compact ? 'EN' : 'English')}
      {option('ta', 'தமிழ்')}
    </div>
  );
}
