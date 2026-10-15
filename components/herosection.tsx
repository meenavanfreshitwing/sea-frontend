'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone, ShieldCheck, Snowflake, Truck } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { getAllProducts } from '@/lib/productService';
import { settingsAPI } from '@/lib/settings-api';
import { formatWeight } from '@/lib/weight';
import { whatsappLink } from '@/components/HelpButton';
import { Product } from '@/types/product';
import { useLanguage } from '@/context/LanguageContext';

interface CatchItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice: number;
  weight: string;
  soldOut: boolean;
}

const IMG_BASE = process.env.NEXT_PUBLIC_IMG_URL;
const LOGO = `${process.env.NEXT_PUBLIC_STATIC_URL}/logoo.webp`;
const MAX_ITEMS = 5;
const ROTATE_MS = 4500;

const imagePath = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${IMG_BASE}/${path.replace(/^\//, '').replace(/^uploads\//, '')}`;
};

// One card per fish, using the default pack's price, weight and photo
const toCatchItem = (product: Product): CatchItem => {
  const variant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
  const price = Number(variant?.price ?? product.basePrice ?? 0);
  const original = Number(variant?.originalPrice ?? product.originalPrice ?? 0);
  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    image: imagePath(variant?.images?.[0]?.image || product.images?.[0]?.image),
    price,
    originalPrice: original > price ? original : 0,
    weight: formatWeight(variant?.weight, variant?.weightUnit),
    soldOut: (variant ? variant.stock : product.stock) <= 0,
  };
};

/**
 * Home page banner: a plain promise on the left (what we sell, where, how to order)
 * and today's fish on the right with real prices.
 */
export default function HeroSection() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    getAllProducts({})
      .then(res => {
        if (!res.success) return;
        const list = (res.data as Product[]).map(toCatchItem);
        // Fish in stock first
        setItems([...list.filter(i => !i.soldOut), ...list.filter(i => i.soldOut)].slice(0, MAX_ITEMS));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    settingsAPI
      .getPublicSettings()
      .then(res => {
        if (!res?.success || !res.data) return;
        setWhatsapp(res.data.whatsappNumber || '');
        setPhone(res.data.contactNumber || '');
      })
      .catch(() => {});
  }, []);

  // Gently rotate through today's fish (stops on hover/touch and for reduced-motion users)
  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setActive(i => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [items.length, paused]);

  const scrollToCatch = () =>
    document.getElementById('todays-catch')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const current = items[active];
  const showPhoto = (item: CatchItem) => item.image && !failed.has(item.id);
  const markFailed = (id: string) => setFailed(prev => new Set(prev).add(id));

  const trust = [
    { icon: Truck, label: t('home.feature1.title') },
    { icon: Snowflake, label: t('home.feature2.tag') },
    { icon: ShieldCheck, label: t('home.feature3.tag') },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#E4F5FB] via-white to-[#E9F7EF]">
      {/* soft background shapes */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#00A9E0]/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-green-300/20 blur-3xl" aria-hidden="true" />

      <div className="container relative mx-auto grid items-center gap-8 px-5 py-8 sm:px-8 lg:px-12 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:py-14">
        {/* Promise + actions */}
        <div className="min-w-0 text-center lg:text-left">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#B8DCE7] bg-white px-3 py-1 text-xs font-semibold text-[#063B5C] shadow-sm sm:text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden="true" />
            <span className="text-left">{t('hero.chip')}</span>
          </span>

          <h1 className="mt-4 break-words text-[32px] font-extrabold leading-[1.15] text-[#063B5C] sm:text-5xl lg:text-[56px] [html.lang-ta_&]:text-[26px] [html.lang-ta_&]:sm:text-4xl [html.lang-ta_&]:lg:text-[44px]">
            {t('hero.title1')}
            <br />
            <span className="text-[#008FB8]">{t('hero.title2')}</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#315A6E] sm:text-lg lg:mx-0">
            {t('hero.sub')}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <button
              type="button"
              onClick={scrollToCatch}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#063B5C] px-7 text-base font-bold text-white shadow-lg transition hover:bg-[#0B4F8A]"
            >
              {t('hero.shop')} <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            {whatsapp ? (
              <a
                href={whatsappLink(whatsapp, t('help.whatsappText'))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-white px-6 text-base font-bold text-[#128C4A] transition hover:bg-[#25D366] hover:text-white"
              >
                <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> {t('hero.whatsappOrder')}
              </a>
            ) : phone ? (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-[#063B5C] bg-white px-6 text-base font-bold text-[#063B5C] transition hover:bg-[#063B5C] hover:text-white"
              >
                <Phone className="h-5 w-5" aria-hidden="true" /> {t('hero.callOrder')}
              </a>
            ) : null}
          </div>

          <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-semibold text-[#063B5C]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#008FB8] shadow-sm ring-1 ring-[#D6ECF3]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Today's catch card */}
        <div
          className="mx-auto w-full min-w-0 max-w-md"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
        >
          {loading ? (
            <div className="h-[420px] animate-pulse rounded-3xl bg-white/70 shadow-xl ring-1 ring-[#D6ECF3]" />
          ) : !current ? null : (
            <div className="rounded-3xl bg-white p-4 shadow-[0_20px_50px_rgba(6,59,92,0.15)] ring-1 ring-[#D6ECF3] sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
                  {t('hero.todayLabel')}
                </span>
                {items.length > 1 && (
                  <span className="text-xs font-medium text-[#315A6E]">
                    {active + 1} / {items.length}
                  </span>
                )}
              </div>

              <Link
                href={`/products/${current.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-[#EAF8FC] to-[#D6ECF3]"
              >
                <Image
                  key={current.id}
                  src={showPhoto(current) ? current.image : LOGO}
                  alt={current.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className={`transition duration-500 group-hover:scale-105 ${showPhoto(current) ? 'object-cover' : 'object-contain p-12'}`}
                  onError={() => markFailed(current.id)}
                />
                {current.soldOut && (
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-red-600 shadow">
                    {t('product.soldOut')}
                  </span>
                )}
              </Link>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[#063B5C]">{current.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-2xl font-extrabold text-[#063B5C]">₹{Math.round(current.price)}</span>
                    {current.weight && <span className="text-sm font-medium text-[#315A6E]">/ {current.weight}</span>}
                    {current.originalPrice > 0 && (
                      <span className="text-sm text-gray-400 line-through">₹{Math.round(current.originalPrice)}</span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/products/${current.slug}`}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-amber-300 px-4 font-bold text-[#063B5C] transition hover:bg-amber-400"
                >
                  {t('hero.view')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {items.length > 1 && (
                <div className="mt-4 flex gap-2" role="tablist" aria-label={t('hero.todayLabel')}>
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-label={item.name}
                      onClick={() => setActive(i)}
                      className={`relative h-14 flex-1 overflow-hidden rounded-xl bg-[#EAF8FC] ring-2 transition ${
                        i === active ? 'ring-[#008FB8]' : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={showPhoto(item) ? item.image : LOGO}
                        alt=""
                        fill
                        sizes="80px"
                        className={showPhoto(item) ? 'object-cover' : 'object-contain p-2'}
                        onError={() => markFailed(item.id)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
