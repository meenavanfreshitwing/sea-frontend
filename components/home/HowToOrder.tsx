'use client';

import { Fish, ShoppingCart, CalendarCheck, Wallet } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// A plain, four-step explanation for first-time customers
const steps = [
  { icon: Fish, title: 'how.s1.title', text: 'how.s1.text' },
  { icon: ShoppingCart, title: 'how.s2.title', text: 'how.s2.text' },
  { icon: CalendarCheck, title: 'how.s3.title', text: 'how.s3.text' },
  { icon: Wallet, title: 'how.s4.title', text: 'how.s4.text' },
] as const;

export default function HowToOrder() {
  const { t } = useLanguage();
  return (
    <section className="bg-[#F0F9FC] py-10 sm:py-16" aria-labelledby="how-to-order-title">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 id="how-to-order-title" className="text-2xl font-bold text-[#063B5C] sm:text-3xl">
            {t('how.title')}
          </h2>
          <p className="mt-2 text-base text-[#315A6E]">{t('how.subtitle')}</p>
        </div>

        <ol className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-[#B8DCE7] bg-white p-5 shadow-sm"
            >
              <span
                className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#063B5C] text-sm font-bold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <step.icon className="mb-3 mt-1 h-8 w-8 text-[#008FB8]" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-[#063B5C]">
                <span className="sr-only">{t('how.step', { n: index + 1 })}: </span>
                {t(step.title)}
              </h3>
              <p className="mt-1 text-base leading-relaxed text-[#315A6E]">{t(step.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
