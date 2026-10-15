import type { TranslationKey } from '@/lib/i18n/translations';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface PublicReview {
  _id: string;
  rating: number;
  comment: string;
  customerName: string;
  productName: string;
  product: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface ReviewableItem {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  image: string;
  deliveredAt: string;
  review: { _id: string; rating: number; comment: string; status: string } | null;
}

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('otp_auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, { cache: 'no-store', ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export const getProductReviews = (productId: string, page = 1) =>
  request<{ summary: ReviewSummary; data: PublicReview[]; totalPages: number }>(
    `/reviews?product=${productId}&page=${page}&limit=5`
  );

export const getReviewHighlights = (limit = 6) =>
  request<{ summary: ReviewSummary; data: PublicReview[] }>(`/reviews/highlights?limit=${limit}`);

export const getMyReviewables = () =>
  request<{ data: ReviewableItem[] }>('/reviews/mine', { headers: authHeaders() });

export const submitReview = (body: { orderId: string; productId: string; rating: number; comment: string }) =>
  request<{ message: string; data: PublicReview }>('/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// "3 days ago", "2 months ago" (in the current language)
export const timeAgo = (iso: string, t: Translate) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return t('time.today');
  if (days === 1) return t('time.yesterday');
  if (days < 30) return t('time.daysAgo', { n: days });
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? t('time.monthAgo') : t('time.monthsAgo', { n: months });
  const years = Math.floor(months / 12);
  return years === 1 ? t('time.yearAgo') : t('time.yearsAgo', { n: years });
};
