'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDeliveryDate } from '@/lib/booking-api';
import { useLanguage } from '@/context/LanguageContext';
import { dateLocale } from '@/lib/i18n/translations';

export default function OrderSuccessPage() {
  const { t, lang } = useLanguage();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get orderId and clear cart
  useEffect(() => {
    if (!isClient) return;

    try {
      // Get orderId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get('orderId');
      const deliveryDateParam = urlParams.get('deliveryDate');
      if (deliveryDateParam && /^\d{4}-\d{2}-\d{2}$/.test(deliveryDateParam)) setDeliveryDate(deliveryDateParam);
      
      if (orderIdParam) {
        setOrderId(orderIdParam);
      } else {
        setError('No order ID found in URL');
      }

      // Clear cart data (only if it exists)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('guestCart');
      }
    } catch (err) {
      console.error('Error processing order success:', err);
      setError('Failed to process order details');
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FCFD] flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-md p-8 border border-[#B8DCE7]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008FB8] mx-auto mb-4"></div>
            <p className="text-[#315A6E]">{t('success.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FCFD] flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-md p-8 border border-[#B8DCE7]">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-[#063B5C] mb-4">{t('success.error')}</h1>
            
            <p className="text-[#315A6E] mb-6">
              {error}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/"
                className="text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium text-center shadow-md hover:shadow-lg"
                style={{ backgroundColor: '#064B6A' }}
              >
                {t('success.home')}
              </Link>
              <Link 
                href="/cart"
                className="px-6 py-3 rounded-lg transition-all duration-200 font-medium text-center"
                style={{ border: '1px solid #008FB8', color: '#008FB8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#008FB8';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#008FB8';
                }}
              >
                {t('checkout.backToCart')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state (stays on screen so the customer can note the order number)
  return (
    <div className="min-h-screen bg-[#F8FCFD] flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-[#B8DCE7]">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#063B5C] mb-2">{t('success.title')}</h1>
          <p className="text-base text-[#315A6E] mb-6">{t('success.text')}</p>

          <dl className="mb-6 divide-y divide-[#E3F1F6] rounded-xl border border-[#B8DCE7] text-left">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-[#315A6E]">{t('success.orderNumber')}</dt>
              <dd className="font-mono font-semibold text-[#063B5C] break-all">#{orderId}</dd>
            </div>
            {deliveryDate && (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[#315A6E]">{t('success.deliveryDate')}</dt>
                <dd className="font-semibold text-[#063B5C]">{formatDeliveryDate(deliveryDate, { weekday: 'long', month: 'long' }, dateLocale(lang))}</dd>
              </div>
            )}
          </dl>

          <p className="mb-6 text-sm text-[#315A6E]">
            {t('success.checkLater')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile"
              className="min-h-[48px] inline-flex items-center justify-center text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg bg-[#064B6A] hover:bg-[#008FB8] transition-colors"
            >
              {t('success.viewOrders')}
            </Link>
            <Link
              href="/products"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border border-[#008FB8] text-[#008FB8] hover:bg-[#008FB8] hover:text-white transition-colors"
            >
              {t('common.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}