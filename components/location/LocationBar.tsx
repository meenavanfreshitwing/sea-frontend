'use client';

import { MapPin } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';

/** "📍 Delivering to Karaikudi – 630001 · Change" — shown only when location pricing is on. */
export default function LocationBar() {
  const { enabled, location, openPicker } = useLocation();
  const { t } = useLanguage();
  if (!enabled || !location) return null;

  return (
    <div className="border-b border-[#B8DCE7] bg-[#EAF6FA]">
      <button
        onClick={openPicker}
        className="container mx-auto flex items-center gap-1.5 px-4 py-1.5 text-left text-sm text-[#063B5C]"
      >
        <MapPin className="h-4 w-4 shrink-0 text-[#008FB8]" aria-hidden="true" />
        <span className="text-[#315A6E]">{t('loc.deliveringTo')}</span>
        <b className="truncate">{location.name} – {location.pincode}</b>
        <span className="ml-1 font-semibold text-[#008FB8] underline underline-offset-2">{t('loc.change')}</span>
      </button>
    </div>
  );
}
