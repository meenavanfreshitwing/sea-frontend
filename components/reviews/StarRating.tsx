'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';


// Read-only stars (supports halves, e.g. 4.5)
export function Stars({ value, size = 16, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-gray-300" style={{ width: size, height: size }} aria-hidden="true" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} aria-hidden="true" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// Tap-to-rate stars with a word under them ("Excellent")
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useLanguage();
  const [hover, setHover] = useState(0);
  const label = (n: number) => t(`reviews.label${n}` as TranslationKey);
  const shown = hover || value;
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${t('reviews.star', { n: i })} – ${label(i)}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Star
              className={`h-8 w-8 transition ${i <= shown ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-sm font-medium text-[#315A6E]">{shown ? label(shown) : t('reviews.tapToRate')}</p>
    </div>
  );
}
