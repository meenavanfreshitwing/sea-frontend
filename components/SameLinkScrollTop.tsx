'use client';

import { useEffect } from 'react';

/**
 * Tapping a link to the page you are already on (e.g. footer "Home" while on the
 * home page) normally does nothing. Scroll back to the top instead, so the tap
 * visibly "works". Links with a #section or ?filters are left alone.
 */
export default function SameLinkScrollTop() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash) return;
      const samePath = url.pathname.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '');
      if (samePath && url.search === window.location.search) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    // capture phase: runs before Next.js <Link> handles (and swallows) the click
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
