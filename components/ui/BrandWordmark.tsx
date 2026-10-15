'use client';

import { useLanguage } from '@/context/LanguageContext';

// "MeenavanFresh" wordmark matching the logo: bold blue "Meenavan" + green "Fresh".
// Fixed brand text (not the editable site name) so it always matches the logo.
const SIZES = {
  sm: 'text-[17px]',
  md: 'text-[17px] sm:text-[22px] xl:text-[26px]',
  lg: 'text-[26px] lg:text-[30px]',
};

export default function BrandWordmark({
  size = 'md',
  tagline = false,
}: {
  size?: keyof typeof SIZES;
  tagline?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <span className="flex min-w-0 flex-col justify-center leading-none">
      <span className={`whitespace-nowrap font-extrabold tracking-tight ${SIZES[size]}`}>
        <span className="text-[#0B4F8A]">Meenavan</span>
        <span className="italic text-[#2E9B3E]">Fresh</span>
      </span>
      {tagline && (
        <span className="mt-1 hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[#315A6E] sm:block">
          {t('brand.tagline')}
        </span>
      )}
    </span>
  );
}
