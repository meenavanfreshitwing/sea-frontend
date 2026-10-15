'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Truck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { dateLocale } from '@/lib/i18n/translations';
import { formatCutoffTime, formatDeliveryDate, getBookingAvailability } from '@/lib/booking-api';
import type { BookingAvailability } from '@/types/booking';

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * The most important message on the site: when the fish arrives.
 * - Before the cutoff: bright bar + live countdown ("Order closes in 3h 41m").
 * - After the cutoff / blocked tomorrow: calm bar with the next delivery date.
 * Follows the admin's booking rules (cutoff time, blocked dates).
 */
export default function DeliveryBar({ targetId = 'todays-catch' }: { targetId?: string }) {
  const { t, lang } = useLanguage();
  const [booking, setBooking] = useState<BookingAvailability | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const loadedAt = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await getBookingAvailability();
      setBooking(data);
      loadedAt.current = Date.now();
      const tomorrow = data.dates[1];
      if (tomorrow?.available) {
        // Count down against the server's India time, not the visitor's clock
        setMinutesLeft(toMinutes(tomorrow.cutoffTime) - toMinutes(data.serverTime));
      } else {
        setMinutesLeft(null);
      }
    } catch {
      setBooking(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tick every 30 seconds; reload when the cutoff passes so the bar switches state
  useEffect(() => {
    if (minutesLeft === null || !booking) return;
    const startMinutes = toMinutes(booking.dates[1]?.cutoffTime || '00:00') - toMinutes(booking.serverTime);
    const timer = setInterval(() => {
      const left = startMinutes - Math.floor((Date.now() - loadedAt.current) / 60000);
      if (left <= 0) {
        clearInterval(timer);
        load();
      } else {
        setMinutesLeft(left);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [booking, load, minutesLeft === null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!booking) return null;

  const locale = dateLocale(lang);
  const longDate = (date: string) => formatDeliveryDate(date, { weekday: 'short', month: 'short' }, locale);
  const tomorrow = booking.dates[1];
  const scrollToProducts = () =>
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Open for tomorrow → urgent yellow bar with countdown
  if (tomorrow?.available && minutesLeft !== null && minutesLeft > 0) {
    const left = t('bar.hm', { h: String(Math.floor(minutesLeft / 60)).padStart(2, '0'), m: String(minutesLeft % 60).padStart(2, '0') });
    return (
      <section className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 text-[#063B5C]" aria-live="polite">
        <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-center sm:gap-6 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#063B5C] text-white sm:h-12 sm:w-12">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[17px] font-extrabold leading-snug sm:text-2xl">
                {t('bar.tomorrowTitle', { date: longDate(tomorrow.date) })}
              </p>
              <p className="text-sm font-semibold sm:text-base">
                {/* Countdown is highlighted inside the sentence (word order differs per language) */}
                {t('bar.closesIn', { left: '\u0000', time: formatCutoffTime(tomorrow.cutoffTime) })
                  .split('\u0000')
                  .map((part, i, all) => (
                    <span key={i}>
                      {part}
                      {i < all.length - 1 && (
                        <span className="mx-1 inline-block whitespace-nowrap rounded bg-[#063B5C] px-1.5 py-0.5 font-mono text-white">{left}</span>
                      )}
                    </span>
                  ))}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToProducts}
            className="min-h-[44px] w-full rounded-xl bg-[#063B5C] px-6 font-bold text-white shadow transition hover:bg-[#0B4F8A] sm:w-auto"
          >
            {t('bar.orderNow')} →
          </button>
        </div>
      </section>
    );
  }

  // Tomorrow closed or blocked → next available date
  if (booking.earliestDate) {
    return (
      <section className="border-y border-sky-200 bg-gradient-to-r from-sky-100 via-white to-sky-100 text-[#063B5C]">
        <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-center sm:gap-6 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#008FB8] text-white sm:h-12 sm:w-12">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[17px] font-extrabold leading-snug sm:text-2xl">
                {t('bar.closedTitle', { date: longDate(booking.earliestDate) })}
              </p>
              <p className="text-sm font-semibold sm:text-base">{t('bar.closedSub', { date: longDate(booking.earliestDate) })}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToProducts}
            className="min-h-[44px] w-full rounded-xl bg-[#063B5C] px-6 font-bold text-white shadow transition hover:bg-[#0B4F8A] sm:w-auto"
          >
            {t('bar.bookNow')} →
          </button>
        </div>
      </section>
    );
  }

  // Bookings switched off by the admin
  return (
    <section className="bg-slate-100 text-[#063B5C]">
      <p className="container mx-auto px-4 py-3 text-center text-base font-bold">
        {booking.config.closedMessage || t('bar.paused')}
      </p>
    </section>
  );
}
