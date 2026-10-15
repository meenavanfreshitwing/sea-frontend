import { Plus_Jakarta_Sans, Noto_Sans_Tamil } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import HeaderWrapper from '@/components/ui/HeaderWrapper';
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
          <CartProvider>
            <HeaderWrapper />
            {children}
            <Footer />
            <BookingNoticePopup />
            <HelpButton />
            <MobileCartBar />
            <SameLinkScrollTop />
          </CartProvider>
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}