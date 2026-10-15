'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, PackageCheck, Phone, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { settingsAPI } from '@/lib/settings-api';
import { whatsappLink } from '@/components/HelpButton';
import { useLanguage } from '@/context/LanguageContext';

export type CancelDialogMode = 'confirm' | 'blocked';

interface Props {
  mode: CancelDialogMode;
  orderNumber: string;
  items: string[];
  total: string;
  paidOnline: boolean;
  /** Why it cannot be cancelled: being packed, or already on the way */
  onTheWay: boolean;
  reason: string;
  busy: boolean;
  error: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Two boxes for cancelling an order:
 * - "confirm": Are you sure? (order summary, optional reason, Keep / Yes cancel)
 * - "blocked": This order can't be cancelled now (packing has started) + Call / WhatsApp
 */
export default function CancelOrderDialog({
  mode, orderNumber, items, total, paidOnline, onTheWay,
  reason, busy, error, onReasonChange, onConfirm, onClose,
}: Props) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (mode !== 'blocked') return;
    settingsAPI
      .getPublicSettings()
      .then(res => {
        if (!res?.success || !res.data) return;
        setPhone(res.data.contactNumber || '');
        setWhatsapp(res.data.whatsappNumber || '');
      })
      .catch(() => {});
  }, [mode]);

  // Close with the Escape key (not while cancelling)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const blocked = mode === 'blocked';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
      onClick={() => !busy && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[#315A6E] hover:bg-[#F0F9FC] disabled:opacity-40"
          aria-label={t('cancel.close')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className={`flex flex-col items-center rounded-t-2xl px-6 pb-4 pt-6 text-center ${blocked ? 'bg-amber-50' : 'bg-red-50'}`}>
          <span className={`flex h-14 w-14 items-center justify-center rounded-full ${blocked ? 'bg-amber-400' : 'bg-red-500'} text-white`}>
            {blocked ? <PackageCheck className="h-7 w-7" aria-hidden="true" /> : <AlertTriangle className="h-7 w-7" aria-hidden="true" />}
          </span>
          <h2 id="cancel-dialog-title" className={`mt-3 text-xl font-bold ${blocked ? 'text-amber-900' : 'text-red-800'}`}>
            {blocked ? t('cancel.blockedTitle') : t('cancel.confirmTitle')}
          </h2>
          <p className="mt-1 text-sm text-[#315A6E]">{t('cancel.orderNo', { id: orderNumber })}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {blocked ? (
            <>
              <p className="text-[15px] leading-relaxed text-[#063B5C]">
                {onTheWay ? t('cancel.blockedOnTheWay') : t('cancel.blockedPacking')}
              </p>
              <p className="text-sm text-[#315A6E]">{t('cancel.blockedHelp')}</p>
              {(phone || whatsapp) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-green-700 font-bold text-white hover:bg-green-800"
                    >
                      <Phone className="h-5 w-5" aria-hidden="true" /> {t('cancel.call')}
                    </a>
                  )}
                  {whatsapp && (
                    <a
                      href={whatsappLink(whatsapp, t('cancel.whatsappText', { id: orderNumber }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#25D366] font-bold text-white hover:bg-[#1ebe5b]"
                    >
                      <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> WhatsApp
                    </a>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#063B5C] font-bold text-[#063B5C] hover:bg-[#F0F9FC]"
              >
                {t('cancel.ok')}
              </button>
            </>
          ) : (
            <>
              <p className="text-[15px] font-medium text-[#063B5C]">{t('cancel.confirmText')}</p>

              <div className="rounded-xl border border-[#D6ECF3] bg-[#F8FCFD] p-3 text-sm">
                <ul className="space-y-1 text-[#063B5C]">
                  {items.slice(0, 4).map((name, i) => (
                    <li key={i} className="truncate">• {name}</li>
                  ))}
                  {items.length > 4 && <li className="text-[#315A6E]">+ {items.length - 4}</li>}
                </ul>
                <p className="mt-2 flex justify-between border-t border-[#D6ECF3] pt-2 font-semibold text-[#063B5C]">
                  <span>{t('cancel.total')}</span>
                  <span>₹{total}</span>
                </p>
              </div>

              {paidOnline && (
                <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">{t('cancel.refundNote')}</p>
              )}

              <div>
                <label htmlFor="cancellationReason" className="mb-1 block text-sm font-medium text-[#315A6E]">
                  {t('cancel.reasonLabel')}
                </label>
                <textarea
                  id="cancellationReason"
                  value={reason}
                  onChange={e => onReasonChange(e.target.value)}
                  placeholder={t('cancel.reasonPh')}
                  rows={2}
                  className="w-full rounded-lg border border-[#B8DCE7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008FB8]"
                />
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#063B5C] font-bold text-[#063B5C] hover:bg-[#F0F9FC] disabled:opacity-50"
                >
                  {t('cancel.keep')}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={busy}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busy && <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />}
                  {busy ? t('cancel.cancelling') : t('cancel.yes')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
