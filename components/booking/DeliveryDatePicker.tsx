'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import type { BookingAvailability, BookingDate } from '@/types/booking';
import { formatCutoffTime, formatDeliveryDate } from '@/lib/booking-api';
import { useLanguage } from '@/context/LanguageContext';
import { dateLocale } from '@/lib/i18n/translations';

interface Props {
  availability: BookingAvailability | null;
  loading: boolean;
  error: string;
  selectedDate: string;
  selectedSlotId: string;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slotId: string) => void;
  onUnavailable: (day: BookingDate) => void;
  onRetry: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const monthKey = (date: string) => date.slice(0, 7);

const shiftMonth = (key: string, delta: number) => {
  const d = new Date(`${key}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
};

export default function DeliveryDatePicker({
  availability, loading, error, selectedDate, selectedSlotId,
  onSelectDate, onSelectSlot, onUnavailable, onRetry,
}: Props) {
  const { t, lang } = useLanguage();
  const locale = dateLocale(lang);
  const [month, setMonth] = useState<string | null>(null);

  const byDate = useMemo(
    () => new Map((availability?.dates || []).map(d => [d.date, d])),
    [availability]
  );

  if (loading && !availability) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-[#315A6E]">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#008FB8]" />
        {t('date.loading')}
      </div>
    );
  }

  if (error || !availability) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error || t('date.loadError')}
        <button onClick={onRetry} className="ml-2 inline-flex items-center gap-1 font-medium underline">
          <RefreshCw size={14} /> {t('common.retry')}
        </button>
      </div>
    );
  }

  const { today, config, dates } = availability;
  const tomorrow = byDate.get(addDays(today, 1));
  const lastDate = dates[dates.length - 1]?.date || today;
  const currentMonth = month || monthKey(selectedDate || availability.earliestDate || today);
  const selectedDay = selectedDate ? byDate.get(selectedDate) : undefined;

  const handleClick = (day: BookingDate | undefined, date: string) => {
    if (!day) return; // outside the booking window
    if (day.available) onSelectDate(date);
    else onUnavailable(day);
  };

  const dayClasses = (day: BookingDate | undefined, date: string) => {
    if (date === selectedDate) return 'bg-[#063B5C] text-white border-[#063B5C] shadow-md';
    if (!day || !day.available) return 'bg-gray-100 text-gray-400 border-gray-200';
    return 'bg-white text-[#063B5C] border-[#B8DCE7] hover:border-[#008FB8] hover:bg-[#F0F9FC]';
  };

  // Month grid: Sunday-first, 6 rows max
  const monthDays = (() => {
    const first = `${currentMonth}-01`;
    const startOffset = new Date(`${first}T00:00:00Z`).getUTCDay();
    const cells: (string | null)[] = Array(startOffset).fill(null);
    for (let date = first; monthKey(date) === currentMonth; date = addDays(date, 1)) cells.push(date);
    return cells;
  })();

  return (
    <div className="space-y-3">
      {/* Cutoff hint */}
      <p className="flex items-start gap-2 text-xs text-[#315A6E] sm:text-sm">
        <Clock size={16} className="mt-0.5 shrink-0 text-[#008FB8]" />
        {!config.bookingEnabled
          ? config.closedMessage
          : tomorrow?.available
            ? t('date.hintOpen', { time: formatCutoffTime(tomorrow.cutoffTime) })
            : t('date.hintClosed')}
      </p>

      {/* Month view */}
      <div className="rounded-xl border border-[#B8DCE7] p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(currentMonth, -1))}
              disabled={currentMonth <= monthKey(today)}
              className="rounded p-1 text-[#063B5C] hover:bg-[#F0F9FC] disabled:opacity-30"
              aria-label={t('date.prevMonth')}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-[#063B5C]">
              {new Date(`${currentMonth}-01T00:00:00Z`).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </span>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(currentMonth, 1))}
              disabled={currentMonth >= monthKey(lastDate)}
              className="rounded p-1 text-[#063B5C] hover:bg-[#F0F9FC] disabled:opacity-30"
              aria-label={t('date.nextMonth')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <span key={w} className="py-1 text-[11px] font-medium text-gray-500">
                {new Date(Date.UTC(2026, 1, 1 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}
              </span>
            ))}
            {monthDays.map((date, i) => {
              if (!date) return <span key={`blank-${i}`} />;
              const day = byDate.get(date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleClick(day, date)}
                  disabled={!day}
                  className={`aspect-square rounded-lg border text-sm font-medium transition ${dayClasses(day, date)} ${!day ? 'cursor-default opacity-60' : ''}`}
                  aria-label={formatDeliveryDate(date, { weekday: 'long', month: 'long' }, locale)}
                >
                  {Number(date.slice(8))}
                </button>
              );
            })}
          </div>
        </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-[#B8DCE7] bg-white" /> {t('date.available')}</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200" /> {t('date.unavailable')}</span>
        </span>
      </div>

      {/* Time slots */}
      {config.timeSlotsEnabled && selectedDay && selectedDay.slots.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[#063B5C]">{t('date.deliveryTime')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedDay.slots.map(slot => (
              <button
                key={slot.slotId}
                type="button"
                disabled={!slot.available}
                onClick={() => onSelectSlot(slot.slotId)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  slot.slotId === selectedSlotId
                    ? 'border-[#063B5C] bg-[#063B5C] text-white'
                    : slot.available
                      ? 'border-[#B8DCE7] text-[#063B5C] hover:border-[#008FB8]'
                      : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && (
        <p className="rounded-lg bg-[#F0F9FC] px-3 py-2 text-sm text-[#063B5C]">
          <strong>{t('date.deliveryOn', { date: formatDeliveryDate(selectedDate, { weekday: 'long', month: 'long' }, locale) })}</strong>
          {selectedDay?.slots.find(s => s.slotId === selectedSlotId)?.label
            ? `, ${selectedDay.slots.find(s => s.slotId === selectedSlotId)?.label}`
            : ''}
        </p>
      )}
    </div>
  );
}
