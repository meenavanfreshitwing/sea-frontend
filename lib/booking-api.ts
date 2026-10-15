import type { BookingAvailability, BookingNotice } from '@/types/booking';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Always fetch fresh: admin changes must show immediately
export async function getBookingAvailability(): Promise<BookingAvailability> {
  const response = await fetch(`${API_BASE_URL}/api/booking/availability`, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Could not load delivery dates');
  }
  return data.data;
}

export async function getBookingNotices(): Promise<BookingNotice[]> {
  const response = await fetch(`${API_BASE_URL}/api/booking/notices`, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || !data.success) return [];
  return data.data;
}

// '2026-10-12' -> 'Mon, 12 Oct'
export const formatDeliveryDate = (date: string, options?: Intl.DateTimeFormatOptions, locale = 'en-IN') =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...options,
  });

// '17:00' -> '5:00 PM'
export const formatCutoffTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
