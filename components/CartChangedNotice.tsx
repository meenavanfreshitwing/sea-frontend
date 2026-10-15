'use client';

import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

// Shown when the server removed cart items whose fish or pack no longer exists
// (e.g. the shop changed the packs of a fish after it was added to the cart).
export default function CartChangedNotice() {
  const { cart } = useCart();
  const { t } = useLanguage();
  const removed = cart?.removedItems || [];
  if (!removed.length) return null;

  return (
    <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">{t('cart.removedTitle')}</p>
      <p className="mt-1">{t('cart.removedText', { items: removed.join(', ') })}</p>
    </div>
  );
}
