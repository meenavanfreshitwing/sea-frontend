import { Plus_Jakarta_Sans, Noto_Sans_Tamil } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { LocationProvider } from '@/context/LocationContext';
import LocationBar from '@/components/location/LocationBar';
import HeaderWrapper from '@/components/ui/HeaderWrapper';
import AnnouncementBar from '@/components/AnnouncementBar';
import Footer from '@/components/Footer';
import BookingNoticePopup from '@/components/booking/BookingNoticePopup';
import HelpButton from '@/components/HelpButton';
import MobileCartBar from '@/components/MobileCartBar';
import SameLinkScrollTop from '@/components/SameLinkScrollTop';

// English: Plus Jakarta Sans. Tamil: Noto Sans Tamil (picked automatically for Tamil letters).
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const tamil = Noto_Sans_Tamil({ subsets: ['tamil'], weight: ['400', '500', '600', '700'], variable: '--font-tamil', display: 'swap' });

// 🎯 Static images base URL (R2)
const STATIC_URL = process.env.NEXT_PUBLIC_STATIC_URL;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${tamil.variable}`}>
      <head>
        <link rel="icon" href={`${STATIC_URL}/logoo.webp`} type="image/png" />
      </head>
      <body>
        <LanguageProvider>
        <AuthProvider>
          <LocationProvider>
          <CartProvider>
            <HeaderWrapper />
            <AnnouncementBar />
            <LocationBar />
            {children}
            <Footer />
            <BookingNoticePopup />
            <HelpButton />
            <MobileCartBar />
            <SameLinkScrollTop />
          </CartProvider>
          </LocationProvider>
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}