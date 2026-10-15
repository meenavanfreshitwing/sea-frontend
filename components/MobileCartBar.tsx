'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

// Pages with their own checkout/buy buttons at the bottom of the screen
const HIDDEN_ON = ['/cart', '/checkout', '/products/', '/order-success'];

/** True when the phone cart bar is on screen (the help button moves up to stay clear of it). */
export function useCartBarVisible() {
  const { cart } = useCart();
  const pathname = usePathname() || '';
  return (cart?.totalItems || 0) > 0 && !HIDDEN_ON.some(path => pathname.startsWith(path));
}

/**
 * Phones only: "🛒 2 items · ₹1,300   Checkout →" just above the bottom navigation,
 * shown whenever the cart has items, so customers never hunt for the cart.
 */
export default function MobileCartBar() {
  const { cart } = useCart();
  const { t } = useLanguage();
  const visible = useCartBarVisible();

  if (!visible) return null;

  const count = cart.totalItems || 0;
  const amount = Math.round(cart.totalPrice || 0).toLocaleString('en-IN');

  return (
    <>
      {/* keeps the end of the page from hiding behind the bar */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <Link
        href="/checkout"
        className="fixed inset-x-3 bottom-[64px] z-40 flex items-center justify-between rounded-2xl bg-[#063B5C] px-4 py-3 text-white shadow-xl lg:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm opacity-90">
              {count === 1 ? t('cartBar.itemsOne') : t('cartBar.items', { n: count })}
            </span>
            <span className="block text-lg font-bold">₹{amount}</span>
          </span>
        </span>
        <span className="rounded-xl bg-amber-300 px-4 py-2 font-bold text-[#063B5C]">{t('cartBar.checkout')} →</span>
      </Link>
    </>
  );
}
