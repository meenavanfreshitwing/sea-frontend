'use client';

import { useState } from 'react';
import { MapPin, LocateFixed, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DeliveryLocation, LocationError, LocationOption, detectPincode, resolvePincode } from '@/lib/location';

interface Props {
  locations: LocationOption[];
  /** Location saved on the customer's account — offered as a one-tap confirm */
  suggested: DeliveryLocation | null;
  current: DeliveryLocation | null;
  /** Missing → the customer must choose (first visit) */
  onClose?: () => void;
  onChoose: (loc: DeliveryLocation) => Promise<void>;
}

export default function LocationPicker({ locations, suggested, current, onClose, onChoose }: Props) {
  const { t } = useLanguage();
  const [showSuggested, setShowSuggested] = useState(Boolean(suggested));
  const [pincode, setPincode] = useState(current?.pincode || '');
  const [place, setPlace] = useState(current?.place || '');
  const [busy, setBusy] = useState<'detect' | 'check' | 'confirm' | null>(null);
  const [error, setError] = useState('');

  const finish = async (loc: DeliveryLocation, kind: 'check' | 'confirm') => {
    setBusy(kind);
    try {
      await onChoose(loc);
    } catch {
      setBusy(null);
    }
  };

  const check = async (pin: string, area: string) => {
    const cleanPin = pin.replace(/\D/g, '');
    if (cleanPin.length !== 6) return setError(t('loc.badPincode'));
    if (!area.trim()) return setError(t('loc.needPlace'));
    setError('');
    setBusy('check');
    try {
      const found = await resolvePincode(cleanPin);
      await finish({ ...found, pincode: cleanPin, place: area.trim() }, 'check');
    } catch (err) {
      setBusy(null);
      setError(err instanceof LocationError || err instanceof Error ? err.message : t('loc.badPincode'));
    }
  };

  const detect = async () => {
    setError('');
    setBusy('detect');
    try {
      const found = await detectPincode();
      setPincode(found.pincode);
      setPlace(found.place);
      setBusy(null);
      // Pincode found: check it straight away (customer can still edit on error)
      if (found.place) await check(found.pincode, found.place);
    } catch (err) {
      setBusy(null);
      setError(err instanceof Error ? err.message : t('loc.badPincode'));
    }
  };

  const input = 'w-full rounded-lg border border-[#B8DCE7] px-3 py-2.5 text-base text-[#063B5C] focus:outline-none focus:ring-2 focus:ring-[#008FB8]';

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="loc-title">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id="loc-title" className="flex items-center gap-2 text-lg font-semibold text-[#063B5C]">
            <MapPin className="h-5 w-5 text-[#008FB8]" aria-hidden="true" /> {t('loc.title')}
          </h2>
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label={t('loc.close')}>
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mb-4 text-sm text-[#315A6E]">{t('loc.subtitle')}</p>

        {showSuggested && suggested ? (
          <div className="space-y-3">
            <p className="rounded-xl bg-[#EAF6FA] px-4 py-3 text-[15px] font-medium text-[#063B5C]">
              📍 {t('loc.confirmSaved', { name: suggested.name, pincode: suggested.pincode })}
              {suggested.place && <span className="block text-sm font-normal text-[#315A6E]">{suggested.place}</span>}
            </p>
            <button
              onClick={() => finish(suggested, 'confirm')}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063B5C] py-3 font-semibold text-white disabled:opacity-60"
            >
              {busy === 'confirm' && <Loader2 className="h-4 w-4 animate-spin" />} {t('loc.confirm')}
            </button>
            <button onClick={() => setShowSuggested(false)} className="w-full py-2 text-sm font-medium text-[#008FB8]">
              {t('loc.useOther')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={detect}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#008FB8] py-3 font-semibold text-[#008FB8] disabled:opacity-60"
            >
              {busy === 'detect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-5 w-5" aria-hidden="true" />}
              {busy === 'detect' ? t('loc.detecting') : t('loc.detect')}
            </button>

            <p className="text-center text-xs uppercase tracking-wide text-gray-400">{t('loc.or')}</p>

            <form onSubmit={e => { e.preventDefault(); check(pincode, place); }} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#063B5C]">{t('loc.pincode')} *</span>
                <input
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="630001"
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#063B5C]">{t('loc.place')} *</span>
                <input value={place} onChange={e => setPlace(e.target.value)} placeholder={t('loc.placeHint')} className={input} />
              </label>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063B5C] py-3 font-semibold text-white disabled:opacity-60"
              >
                {busy === 'check' && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy === 'check' ? t('loc.checking') : t('loc.continue')}
              </button>
            </form>

            {locations.length > 0 && (
              <p className="text-center text-xs text-[#315A6E]">
                {t('loc.weServe', { names: locations.map(l => l.name).join(', ') })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
