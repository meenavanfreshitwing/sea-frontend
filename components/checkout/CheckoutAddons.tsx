'use client';

import { Minus, Plus, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AddonGroup, addonImageUrl } from '@/lib/addons';

interface Props {
  groups: AddonGroup[];
  /** addonId → quantity currently chosen */
  quantities: Record<string, number>;
  /** add-on being saved (cart mode), shows a spinner */
  busyId?: string | null;
  onChange: (addonId: string, quantity: number) => void;
}

/** "Add masala to your order" — every add-on the shop has switched ON, grouped by category. */
export default function CheckoutAddons({ groups, quantities, busyId, onChange }: Props) {
  const { t } = useLanguage();
  if (!groups.length) return null;

  return (
    <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:p-4" aria-labelledby="addons-title">
      <h3 id="addons-title" className="font-semibold text-[#063B5C]">🍳 {t('addons.title')}</h3>
      <p className="mb-3 text-xs text-[#315A6E]">{t('addons.subtitle')}</p>

      <div className="space-y-3">
        {groups.map(group => (
          <div key={group.category._id}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">{group.category.name}</p>
            <ul className="space-y-2">
              {group.addons.map(addon => {
                const qty = quantities[addon._id] || 0;
                const img = addonImageUrl(addon.image);
                const busy = busyId === addon._id;
                return (
                  <li key={addon._id} className={`flex items-center gap-3 rounded-lg bg-white p-2 ring-1 ${qty ? 'ring-[#008FB8]' : 'ring-[#B8DCE7]'}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-amber-100 text-xl">
                      {img ? <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" /> : '🌶️'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#063B5C]">{addon.name}</p>
                      {addon.description && <p className="line-clamp-2 text-xs text-[#315A6E]">{addon.description}</p>}
                      <p className="text-sm font-semibold text-[#063B5C]">
                        ₹{addon.price}
                        {addon.stock <= 5 && <span className="ml-2 text-xs font-medium text-amber-700">{t('addons.left', { n: addon.stock })}</span>}
                      </p>
                    </div>
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onChange(addon._id, 1)}
                        disabled={busy}
                        className="flex h-9 shrink-0 items-center gap-1 rounded-lg border-2 border-[#008FB8] px-3 text-sm font-semibold text-[#008FB8] disabled:opacity-60"
                        aria-label={`${t('addons.add')} ${addon.name}`}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('addons.add')}
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center rounded-lg border border-[#008FB8] bg-white">
                        <button
                          type="button"
                          onClick={() => onChange(addon._id, qty - 1)}
                          disabled={busy}
                          className="flex h-9 w-9 items-center justify-center text-[#063B5C] disabled:opacity-40"
                          aria-label={t('cart.decrease')}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-6 text-center font-semibold text-[#063B5C]" aria-live="polite">
                          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChange(addon._id, qty + 1)}
                          disabled={busy || qty >= addon.stock}
                          className="flex h-9 w-9 items-center justify-center text-[#063B5C] disabled:opacity-40"
                          aria-label={t('cart.increase')}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
