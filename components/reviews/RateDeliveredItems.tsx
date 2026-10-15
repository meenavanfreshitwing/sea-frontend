'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquareHeart } from 'lucide-react';
import { StarInput, Stars } from './StarRating';
import { getMyReviewables, submitReview, type ReviewableItem } from '@/lib/review-api';
import { useLanguage } from '@/context/LanguageContext';

const IMG_URL = process.env.NEXT_PUBLIC_IMG_URL;

function ItemReviewForm({ item, onSaved }: { item: ReviewableItem; onSaved: (item: ReviewableItem) => void }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(!item.review);
  const [rating, setRating] = useState(item.review?.rating || 0);
  const [comment, setComment] = useState(item.review?.comment || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!rating) {
      setError(t('reviews.needStars'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await submitReview({ orderId: item.orderId, productId: item.productId, rating, comment });
      onSaved({ ...item, review: { _id: res.data._id, rating, comment, status: 'published' } });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="flex gap-3 py-4 first:pt-0">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#EAF8FC]">
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${IMG_URL}/${item.image}`} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#063B5C]">{item.productName}</p>
        <p className="text-xs text-[#315A6E]">{t('reviews.order', { n: item.orderNumber })}</p>

        {!editing && item.review ? (
          <div className="mt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Stars value={item.review.rating} size={16} />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t('reviews.thanks')}
              </span>
              <button onClick={() => setEditing(true)} className="text-sm font-medium text-[#008FB8] hover:underline">
                {t('reviews.edit')}
              </button>
            </div>
            {item.review.comment && <p className="mt-1 text-sm text-[#315A6E]">“{item.review.comment}”</p>}
            {item.review.status === 'hidden' && (
              <p className="mt-1 text-xs text-amber-700">{t('reviews.hiddenNote')}</p>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <StarInput value={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder={t('reviews.placeholder')}
              className="w-full rounded-lg border border-[#B8DCE7] px-3 py-2 text-base text-[#063B5C] focus:border-[#008FB8] focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="min-h-[44px] rounded-xl bg-[#064B6A] px-5 font-semibold text-white hover:bg-[#008FB8] disabled:opacity-50"
              >
                {saving ? t('reviews.saving') : t('reviews.submit')}
              </button>
              {item.review && (
                <button onClick={() => setEditing(false)} className="min-h-[44px] rounded-xl px-4 text-[#315A6E] hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

// "Rate your fish" card on the profile page – one entry per delivered item.
export default function RateDeliveredItems() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ReviewableItem[] | null>(null);

  useEffect(() => {
    getMyReviewables()
      .then(res => setItems(res.data))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  const pending = items.filter(i => !i.review).length;
  const replace = (updated: ReviewableItem) =>
    setItems(prev => (prev || []).map(i => (i.orderId === updated.orderId && i.productId === updated.productId ? updated : i)));

  return (
    <section className="rounded-2xl border border-[#B8DCE7] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="rate-title">
      <h2 id="rate-title" className="flex items-center gap-2 text-lg font-bold text-[#063B5C] sm:text-xl">
        <MessageSquareHeart className="h-6 w-6 text-[#008FB8]" aria-hidden="true" />
        {t('reviews.rateTitle')}
      </h2>
      <p className="mt-1 text-sm text-[#315A6E]">
        {pending > 1
          ? t('reviews.ratePending', { n: pending })
          : pending === 1
            ? t('reviews.ratePendingOne')
            : t('reviews.rateDone')}
      </p>
      <ul className="mt-4 divide-y divide-[#E3F1F6]">
        {items.map(item => (
          <ItemReviewForm key={`${item.orderId}_${item.productId}`} item={item} onSaved={replace} />
        ))}
      </ul>
    </section>
  );
}
