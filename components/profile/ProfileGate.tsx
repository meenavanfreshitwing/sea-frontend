'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ProfilePage from '@/components/profile/ProfilePage';

// "My Orders" needs a logged-in customer: show a clear login prompt instead of an error.
export default function ProfileGate() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FCFD]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#008FB8]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F8FCFD] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#B8DCE7] bg-white p-6 text-center shadow-md sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF8FC] text-2xl" aria-hidden="true">📦</div>
          <h1 className="text-xl font-bold text-[#063B5C] sm:text-2xl">{t('profile.loginTitle')}</h1>
          <p className="mt-2 text-[#315A6E]">{t('profile.loginSub')}</p>
          <Link
            href="/login?returnTo=%2Fprofile"
            className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#063B5C] font-bold text-white transition hover:bg-[#0B4F8A]"
          >
            {t('checkout.loginBtn')}
          </Link>
        </div>
      </div>
    );
  }

  return <ProfilePage />;
}
