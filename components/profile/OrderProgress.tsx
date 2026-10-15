'use client';

import { Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';

const STEPS: TranslationKey[] = ['track.placed', 'track.confirmed', 'track.onTheWay', 'track.delivered'];

// How far the order has got: Placed → Confirmed → On the way → Delivered
const currentStep = (orderStatus: string, deliveryStatus?: string) => {
  if (orderStatus === 'delivered' || deliveryStatus === 'delivered') return 3;
  if (orderStatus === 'shipped' || deliveryStatus === 'picked_up') return 2;
  if (['confirmed', 'processing'].includes(orderStatus)) return 1;
  return 0;
};

export default function OrderProgress({ orderStatus, deliveryStatus }: { orderStatus: string; deliveryStatus?: string }) {
  const { t } = useLanguage();
  if (orderStatus === 'cancelled') return null;
  const step = currentStep(orderStatus, deliveryStatus);

  return (
    <ol className="mb-4 flex max-w-lg items-start" aria-label={t('track.label')}>
      {STEPS.map((key, i) => {
        const done = i <= step;
        return (
          <li key={key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-3 h-1 w-full -translate-y-1/2 ${i <= step ? 'bg-green-500' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-green-500 text-white' : 'border-2 border-gray-300 bg-white text-gray-400'
              } ${i === step ? 'ring-4 ring-green-100' : ''}`}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={`mt-1.5 break-words px-0.5 text-[11px] leading-tight sm:text-xs ${
                i === step ? 'font-bold text-[#063B5C]' : done ? 'text-[#315A6E]' : 'text-gray-400'
              }`}
            >
              {t(key)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
