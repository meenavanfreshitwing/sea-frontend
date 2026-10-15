'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getBookingNotices, formatDeliveryDate } from '@/lib/booking-api';
import type { BookingNotice } from '@/types/booking';
import { useLanguage } from '@/context/LanguageContext';
import { dateLocale } from '@/lib/i18n/translations';

// Remembers dismissed notices per browser; an edited notice (new updatedAt) shows again
const STORAGE_KEY = 'dismissedBookingNotices';

const noticeKey = (n: BookingNotice) => `${n.date}|${n.updatedAt}`;

const readDismissed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export default function BookingNoticePopup() {
  const { t, lang } = useLanguage();
  const [notices, setNotices] = useState<BookingNotice[]>([]);

  useEffect(() => {
    const load = async () => {
      const all = await getBookingNotices().catch(() => []);
      const dismissed = new Set(readDismissed());
      setNotices(all.filter(n => !dismissed.has(noticeKey(n))));
    };
    load();
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (notices.length === 0) return null;

  const dismiss = () => {
    try {
      const keep = readDismissed().slice(-50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...keep, ...notices.map(noticeKey)]));
    } catch {
      // Storage unavailable (private mode): just hide for this visit
    }
    setNotices([]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="alertdialog"
        aria-labelledby="booking-notice-title"
      >
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-amber-800/70 hover:bg-amber-200/60"
          aria-label={t('notice.ok')}
        >
          <X size={20} />
        </button>
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 pb-4 pt-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 shadow-lg">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h2 id="booking-notice-title" className="mt-3 px-8 text-xl font-bold text-amber-800">
            {notices.length === 1 ? notices[0].title : t('notice.many')}
          </h2>
        </div>
        <div className="max-h-[50vh] space-y-4 overflow-y-auto px-6 py-5">
          {notices.map(n => (
            <div key={noticeKey(n)}>
              {notices.length > 1 && <p className="font-semibold text-[#063B5C]">{n.title}</p>}
              <p className="text-sm font-medium text-amber-700">
                {formatDeliveryDate(n.date, { weekday: 'long', month: 'long' }, dateLocale(lang))}
              </p>
              <p className="mt-1 text-[#315A6E] leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={dismiss}
            className="w-full rounded-xl bg-gradient-to-r from-[#064B6A] to-[#008FB8] py-3 font-semibold text-white shadow-lg"
          >
            {t('notice.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
