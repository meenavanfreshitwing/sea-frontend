'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Quote } from 'lucide-react';
import { Stars } from './StarRating';
import { getReviewHighlights, timeAgo, type PublicReview, type ReviewSummary } from '@/lib/review-api';
import { useLanguage } from '@/context/LanguageContext';

// Real reviews from customers whose orders were delivered.
// Hidden until the first review exists – no placeholder testimonials.
export default function HomeReviews() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    getReviewHighlights(6)
      .then(res => {
        setSummary(res.summary);
        setReviews(res.data);
      })
      .catch(() => setReviews([]));
  }, []);

  if (!summary || summary.count === 0 || reviews.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16" aria-labelledby="home-reviews-title">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 id="home-reviews-title" className="text-2xl font-bold text-[#063B5C] sm:text-3xl">
            {t('reviews.homeTitle')}
          </h2>
          <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-[#F0F9FC] px-4 py-2">
            <Stars value={summary.average} size={20} />
            <span className="font-semibold text-[#063B5C]">{t('reviews.homeAvg', { avg: summary.average.toFixed(1) })}</span>
            <span className="text-sm text-[#315A6E]">
              {summary.count === 1 ? t('reviews.homeFromOne') : t('reviews.homeFrom', { n: summary.count })}
            </span>
          </div>
        </div>

        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4">
          {reviews.map(review => (
            <li
              key={review._id}
              className="flex w-full flex-col rounded-2xl border border-[#B8DCE7] bg-white p-5 shadow-sm sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
            >
              <div className="flex items-center justify-between">
                <Stars value={review.rating} size={18} />
                <Quote className="h-6 w-6 text-[#B8DCE7]" aria-hidden="true" />
              </div>
              <p className="mt-3 flex-1 leading-relaxed text-[#315A6E]">“{review.comment}”</p>
              <div className="mt-4 border-t border-[#E3F1F6] pt-3">
                <p className="font-semibold text-[#063B5C]">{review.customerName}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#315A6E]">
                  <span className="inline-flex items-center gap-1 font-medium text-green-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t('reviews.verified')}
                  </span>
                  {review.productName && <span>· {review.productName}</span>}
                  <span>· {timeAgo(review.createdAt, t)}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-[#315A6E]">
          {t('reviews.homeCta')}{' '}
          <Link href="/profile" className="font-semibold text-[#008FB8] hover:underline">
            {t('reviews.myAccountOrders')}
          </Link>
        </p>
      </div>
    </section>
  );
}
