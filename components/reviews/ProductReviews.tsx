'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Stars } from './StarRating';
import { getProductReviews, timeAgo, type PublicReview, type ReviewSummary } from '@/lib/review-api';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductReviews({ productId }: { productId: string }) {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProductReviews(productId, page)
      .then(res => {
        if (cancelled) return;
        setSummary(res.summary);
        setTotalPages(res.totalPages);
        setReviews(prev => (page === 1 ? res.data : [...prev, ...res.data]));
      })
      .catch(() => !cancelled && setSummary({ average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [productId, page]);

  return (
    <section id="reviews" className="mt-10 rounded-2xl border border-[#B8DCE7] bg-white p-5 sm:p-8" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="mb-5 text-xl font-bold text-[#063B5C] sm:text-2xl">{t('reviews.title')}</h2>

      {loading && !summary ? (
        <p className="text-[#315A6E]">{t('reviews.loading')}</p>
      ) : !summary || summary.count === 0 ? (
        <div className="rounded-xl bg-[#F0F9FC] p-5 text-center">
          <p className="font-semibold text-[#063B5C]">{t('reviews.none')}</p>
          <p className="mt-1 text-sm text-[#315A6E]">{t('reviews.noneText')}</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          {/* Summary */}
          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-[#063B5C]">{summary.average.toFixed(1)}</span>
              <span className="mb-1.5 text-[#315A6E]">{t('reviews.outOf5')}</span>
            </div>
            <Stars value={summary.average} size={22} className="mt-1" />
            <p className="mt-1 text-sm text-[#315A6E]">
              {summary.count === 1 ? t('reviews.basedOnOne') : t('reviews.basedOn', { n: summary.count })}
            </p>
            <ul className="mt-4 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map(star => {
                const count = summary.breakdown[String(star) as keyof ReviewSummary['breakdown']] || 0;
                const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
                return (
                  <li key={star} className="flex items-center gap-2 text-sm text-[#315A6E]">
                    <span className="w-20 shrink-0">{t('reviews.star', { n: star })}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-9 shrink-0 text-right">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* List */}
          <div>
            <ul className="divide-y divide-[#E3F1F6]">
              {reviews.map(review => (
                <li key={review._id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={review.rating} size={16} />
                    <span className="font-semibold text-[#063B5C]">{review.customerName}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t('reviews.verified')}
                    </span>
                    <span className="text-xs text-[#315A6E]/80">{timeAgo(review.createdAt, t)}</span>
                  </div>
                  {review.comment && <p className="mt-2 leading-relaxed text-[#315A6E]">{review.comment}</p>}
                </li>
              ))}
            </ul>
            {page < totalPages && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="mt-2 rounded-xl border border-[#008FB8] px-5 py-2.5 text-sm font-semibold text-[#008FB8] hover:bg-[#008FB8] hover:text-white"
              >
                {t('reviews.more')}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
