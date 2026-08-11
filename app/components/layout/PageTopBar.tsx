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
      const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString('en-GB', { month: 'long' });
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setDateLabel(`${weekday}, ${day} ${month} ${year} - ${hours}.${minutes} ${ampm}`);
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good Morning!' : h < 17 ? 'Good Afternoon!' : 'Good Evening!');
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
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
