'use client';

import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { settingsAPI } from '@/lib/settings-api';
import { useLanguage } from '@/context/LanguageContext';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappLink } from '@/components/HelpButton';

// Inline "Need help ordering? Call us" for the cart and checkout pages.
export default function HelpLine() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

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

  if (!phone && !whatsapp) return null;

  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-1 text-center text-sm text-[#315A6E]">
      {t('help.ordering')}
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          className="inline-flex items-center gap-1 font-semibold text-green-700 underline-offset-2 hover:underline"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {t('help.call', { phone })}
        </a>
      )}
      {phone && whatsapp && <span>{t('help.or')}</span>}
      {whatsapp && (
        <a
          href={whatsappLink(whatsapp, t('help.whatsappText'))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[#128C7E] underline-offset-2 hover:underline"
        >
          <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
          {t('help.whatsappShort')}
        </a>
      )}
    </p>
  );
}
