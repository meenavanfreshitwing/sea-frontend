// components/home/HomeClient.tsx
'use client';

import { Truck, Shield, Minus, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Category } from '@/types/category';
import ProductGrid from '@/components/products/ProductGrid';
import { getAllProducts } from '@/lib/productService';
import HomeReviews from '@/components/reviews/HomeReviews';
import HomeHeroBanner from '@/components/HomeHeroBanner';
import CategoryCarousel from '@/components/home/Carousal';
import DeliveryBar from '@/components/home/DeliveryBar';
import HeroSection from '@/components/herosection';
import HowToOrder from '@/components/home/HowToOrder';
import { getBookingAvailability, formatCutoffTime } from '@/lib/booking-api';
import type { BookingAvailability } from '@/types/booking';
import { useLanguage } from '@/context/LanguageContext';

const HOME_FISH_LIMIT = 12;

interface HomeClientProps {
  categories: Category[];
  featuredCategories: Category[];
}

export default function HomeClient({ categories, featuredCategories }: HomeClientProps) {
  const { t } = useLanguage();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // All fish together in one grid (count decides the empty message and "View all")
  const [fishCount, setFishCount] = useState<number | null>(null);
  const [booking, setBooking] = useState<BookingAvailability | null>(null);

  useEffect(() => {
    getBookingAvailability().then(setBooking).catch(() => setBooking(null));
  }, []);


  useEffect(() => {
    getAllProducts({})
      .then(res => setFishCount(res.data?.length || 0))
      .catch(() => setFishCount(0));
  }, []);

  // Plain-language answers; cutoff time follows the admin's booking rules
  const cutoffLabel = booking ? formatCutoffTime(booking.config.cutoffTime) : '5:00 PM';
  const faqItems = ([1, 2, 3, 4, 5, 6, 7, 8] as const).map(n => ({
    question: t(`faq.q${n}`),
    answer: t(`faq.a${n}`, { time: cutoffLabel }),
  }));

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* When the fish arrives – first thing customers see */}
      <DeliveryBar />

      <HeroSection />

      {categories && categories.length > 0 && (
        <CategoryCarousel displayCategories={categories} />
      )}

      <div id="todays-catch" className="scroll-mt-24" />

      {/* Today's catch: every fish in one grid */}
      {fishCount !== null && fishCount > 0 && (
        <section className="py-6 sm:py-10">
          <div className="container mx-auto px-1 sm:px-2">
            <div className="mb-6 px-2 text-center sm:mb-8">
              <h2 className="mb-2 text-2xl font-bold animate-gradient-text sm:mb-3 sm:text-3xl md:text-4xl">
                {t('home.catchTitle')}
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[#315A6E] sm:text-base">{t('home.catchSubtitle')}</p>
            </div>

            <ProductGrid limit={HOME_FISH_LIMIT} hideFilters={true} />

            {fishCount > HOME_FISH_LIMIT && (
              <div className="mt-6 flex justify-center sm:mt-8">
                <Link
                  href="/products"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#063B5C] px-6 font-bold text-[#063B5C] transition hover:bg-[#063B5C] hover:text-white"
                >
                  {t('home.viewAll', { n: fishCount })} →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {fishCount === 0 && (
        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm sm:text-base text-[#315A6E]/60">{t('home.noFish')}</p>
          </div>
        </section>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8"
      >
        <HomeHeroBanner />
      </motion.div>

      <HowToOrder />

      {/* Why Choose Us Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-10 sm:py-20"
      >
        <div className="container mx-auto px-3 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6 sm:mb-12"
          >
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 tracking-tight animate-gradient-text">
              {t('home.whyTitle')}
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-16 sm:w-20 h-1 mx-auto mb-3 sm:mb-6 rounded-full"
              style={{ backgroundColor: '#008FB8' }}
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto text-xs sm:text-base md:text-lg text-[#315A6E] px-2 sm:px-0"
            >
              {t('home.whySubtitle')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
            {[
              { icon: Calendar, title: t('home.feature1.title'), desc: t('home.feature1.desc'), highlight: t('home.feature1.tag') },
              { icon: Truck, title: t('home.feature2.title'), desc: t('home.feature2.desc'), highlight: t('home.feature2.tag') },
              { icon: Shield, title: t('home.feature3.title'), desc: t('home.feature3.desc'), highlight: t('home.feature3.tag') },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                whileHover={{ y: -5 }}
                className="group p-4 sm:p-7 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,143,184,0.12)] flex flex-col items-center text-center bg-white border border-[#B8DCE7]"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="w-11 h-11 sm:w-16 sm:h-16 mb-3 sm:mb-6 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-500 shadow-sm bg-[#008FB8]/10 text-[#008FB8] group-hover:bg-[#008FB8] group-hover:text-white"
                >
                  <feature.icon size={20} className="sm:w-[28px] sm:h-[28px]" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-base sm:text-xl font-bold mb-1.5 sm:mb-3 text-[#063B5C]">{feature.title}</h3>
                <p className="text-[#315A6E]/80 leading-relaxed mb-3 sm:mb-6 text-xs sm:text-[15px] px-1">{feature.desc}</p>
                <div className="mt-auto">
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#008FB8]/10 text-[#008FB8] border border-[#008FB8]/20 group-hover:bg-[#008FB8] group-hover:text-white transition-all duration-300"
                  >
                    {feature.highlight}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      
      {/* Real customer reviews (verified purchases) */}
      <HomeReviews />

      {/* FAQ Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-10 sm:py-12 border-t border-[#B8DCE7]"
      >
        <div className="container mx-auto px-3 sm:px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6 sm:mb-10"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 animate-gradient-text">
              {t('faq.title')}
            </h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto text-xs sm:text-base text-[#315A6E]"
            >
              {t('faq.subtitle')}
            </motion.p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqItems.map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg border border-[#B8DCE7] bg-white"
              >
                <button 
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex justify-between items-center gap-2 transition-colors duration-300 hover:bg-[#F8FCFD]" 
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-base sm:text-lg text-[#063B5C] leading-snug">{faq.question}</span>
                  <motion.span 
                    animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                    style={{ color: '#008FB8' }}
                  >
                    {openFaqIndex === index ? <Minus className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </motion.span>
                </button>
                <motion.div 
                  initial={false}
                  animate={{ 
                    height: openFaqIndex === index ? "auto" : 0,
                    opacity: openFaqIndex === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                    <p className="text-[15px] sm:text-base leading-relaxed text-[#315A6E]">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-slide-in { animation: slide-in 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          display: inline-block;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .animate-gradient-text {
          animation: gradient-shift 3s ease infinite;
          background-image: linear-gradient(135deg, #063B5C 0%, #008FB8 50%, #00A9E0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media (max-width: 640px) {
          .animate-marquee {
            animation-duration: 15s;
          }
        }
      `}</style>
    </div>
  );
}