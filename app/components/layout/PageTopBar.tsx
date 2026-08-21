'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function PageTopBar({
  section,
  page,
  right,
  showGreeting = false,
}: {
  /** Grey breadcrumb prefix, e.g. "Career Hub". Renders "{section} > {page}" — pass `right` instead for anything else. */
  section?: string;
  page?: string;
  right?: ReactNode;
  showGreeting?: boolean;
}) {
  const [dateLabel, setDateLabel] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setDateLabel(`${datePart} - ${timePart}`);
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good Morning!' : h < 17 ? 'Good Afternoon!' : 'Good Evening!');
    };
    update();
    const id = setInterval(update, 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const content =
    section && page ? (
      <>
        <span className="text-amana-neutral-300">{section}</span> <span className="text-amana-neutral-300">{'>'}</span> {page}
      </>
    ) : (
      right
    );

  return (
    <div className="flex-shrink-0 -mt-2 md:-mt-3 lg:-mt-4 bg-amana-neutral-100 rounded-b-[10px] shadow-sm px-3 py-2.5">
      {showGreeting && <p className="text-[16px] font-semibold text-amana-primary-500">{greeting}</p>}
      <div className="flex items-center gap-2.5">
        <p className="flex-1 min-w-0 text-[16px] font-semibold text-amana-primary-500 truncate">{dateLabel}</p>
        <div className="flex-1 text-[16px] font-semibold text-amana-primary-500 text-right">{content}</div>
      </div>
      <div className="border-t-2 border-amana-primary-500" />
    </div>
  );
}
