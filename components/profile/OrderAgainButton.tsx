'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { getProductById } from '@/lib/productService';

interface OrderItem {
  product: string | { _id: string };
  variantId?: string | null;
  quantity: number;
}

/**
 * Puts every fish from a past order back into the cart (current prices),
 * skipping anything sold out today, then opens the cart.
 */
export default function OrderAgainButton({ items }: { items: OrderItem[] }) {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const orderAgain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    setNote('');
    let added = 0;
    let skipped = 0;
    try {
      for (const item of items) {
        const id = typeof item.product === 'string' ? item.product : item.product?._id;
        const product = id ? await getProductById(id) : null;
        if (!product || product.status === 'inactive') {
          skipped++;
          continue;
        }
        const variant = item.variantId ? product.variants?.find(v => v._id === item.variantId) : undefined;
        const stock = variant ? variant.stock : product.stock;
        if (!stock || stock <= 0 || (item.variantId && !variant)) {
          skipped++;
          continue;
        }
        await addToCart(product, Math.min(item.quantity, stock), variant);
        added++;
      }
      if (added > 0) {
        router.push('/cart');
      } else {
        setNote(t('profile.orderAgainSkipped'));
      }
      if (added > 0 && skipped > 0) setNote(t('profile.orderAgainSkipped'));
    } catch {
      setNote(t('profile.orderAgainFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1 lg:items-end">
      <button
        type="button"
        onClick={orderAgain}
        disabled={busy}
        className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#063B5C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B4F8A] disabled:opacity-60"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        {busy ? t('profile.orderAgainAdding') : t('profile.orderAgain')}
      </button>
      {note && <p className="max-w-[220px] text-xs text-amber-700">{note}</p>}
    </div>
  );
}
