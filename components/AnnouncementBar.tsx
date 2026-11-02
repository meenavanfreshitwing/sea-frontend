'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { settingsAPI } from '@/lib/settings-api';

/**
 * Store-wide announcement typed by the admin (Settings → General → Announcement).
 * Hidden while the admin has it switched off or empty. Each line in the admin box is its own line here.
 */
export default function AnnouncementBar() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    settingsAPI
      .getPublicSettings()
      .then(res => {
        const text = res.success ? res.data.announcement || '' : '';
        setLines(text.split('\n').map(l => l.trim()).filter(Boolean));
      })
      .catch(() => setLines([]));
  }, []);

  if (lines.length === 0) return null;

  return (
    <section className="bg-[#063B5C] text-white" role="status">
      <div className="container mx-auto flex items-start justify-center gap-3 px-4 py-2.5 sm:items-center">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 sm:mt-0" aria-hidden="true" />
        <div className="text-sm font-medium leading-relaxed sm:text-center sm:text-[15px]">
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
