'use client';

import { useEffect, useState } from 'react';

export default function PageTopBar({
  showGreeting = false,
}: {
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
      setDateLabel(`${weekday}, ${day} ${month} ${year} - ${hours}:${minutes} ${ampm}`);
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

  return (
    <div className="flex-shrink-0 -mt-2 md:-mt-3 lg:-mt-4 bg-amana-neutral-100 rounded-b-[5px] shadow-sm px-3 py-2.5">
      <div className="flex items-center justify-between gap-2.5">
        <p className="flex-1 min-w-0 text-[16px] font-semibold text-amana-primary-500 truncate">
          {showGreeting ? greeting : ''}
        </p>
        <p className="flex-1 min-w-0 text-[16px] font-semibold text-amana-primary-500 text-right truncate">
          {dateLabel}
        </p>
      </div>
      <div className="border-t-2 border-amana-primary-500" />
    </div>
  );
}
