'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { settingsAPI } from '@/lib/settings-api';
import { useLanguage } from '@/context/LanguageContext';
import { useCartBarVisible } from '@/components/MobileCartBar';

// Pages with their own help line and important buttons near the bottom of the screen
const HIDDEN_ON = ['/cart', '/checkout'];

// wa.me needs the country code: a plain 10-digit Indian number gets 91 in front
export const whatsappLink = (number: string, text: string) => {
  let digits = number.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

// Floating "WhatsApp" + "Call us" buttons so customers who get stuck can reach the shop.
// Numbers come from Admin → Settings; each button is hidden when its number is not set.
export default function HelpButton() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const pathname = usePathname() || '';
  const cartBarVisible = useCartBarVisible();

  useEffect(() => {
    settingsAPI
      .getPublicSettings()
      .then(res => {
        if (!res?.success || !res.data) return;
        setPhone(res.data.contactNumber || '');
        setWhatsapp(res.data.whatsappNumber || '');
      })
      .catch(() => setPhone(''));
  }, []);

  if ((!phone && !whatsapp) || HIDDEN_ON.some(path => pathname.startsWith(path))) return null;

  // Product pages have buy buttons near the bottom on phones: show these on desktop only there
  const visibility = pathname.startsWith('/products/') ? 'hidden lg:flex' : 'flex';
  // Sit above the phone cart bar when it is showing
  const bottom = cartBarVisible ? 'bottom-[136px]' : 'bottom-20';
  const pill =
    'h-12 w-12 items-center justify-center gap-2 rounded-full text-white shadow-lg transition focus:outline-none focus-visible:ring-4 sm:h-auto sm:w-auto sm:px-4 sm:py-3';

  return (
    <div className={`fixed right-4 ${bottom} lg:bottom-6 z-40 ${visibility} flex-col items-end gap-3`}>
      {whatsapp && (
        <a
          href={whatsappLink(whatsapp, t('help.whatsappText'))}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex ${pill} bg-[#25D366] hover:bg-[#1ebe5b] focus-visible:ring-green-300`}
          aria-label={t('help.whatsapp')}
          title={t('help.whatsapp')}
        >
          <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
          <span className="hidden text-sm font-semibold sm:inline">{t('help.whatsapp')}</span>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          // On phones only one round button is shown (WhatsApp when set) so less content is covered
          className={`${whatsapp ? 'hidden lg:flex' : 'flex'} ${pill} bg-green-700 hover:bg-green-800 focus-visible:ring-green-300`}
          aria-label={`${t('help.button')} – ${phone}`}
          title={t('help.button')}
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          <span className="hidden text-sm font-semibold sm:inline">{t('help.button')}</span>
        </a>
      )}
    </div>
  );
}
