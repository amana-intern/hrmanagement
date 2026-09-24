'use client';

import { cn } from '@/app/utils/cn';

/** Percent-based progress bar for uploads/long-running actions (Figma node 710:2945). */
export default function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const barColor = pct >= 100 ? 'bg-amana-primary-500' : pct >= 50 ? 'bg-amana-primary-400' : 'bg-amana-primary-300';
  const labelColor = pct >= 100 ? 'text-amana-primary-500' : pct >= 50 ? 'text-amana-primary-400' : 'text-amana-primary-300';

  return (
    <div className="w-full flex flex-col gap-1">
      <p className={cn('text-[16px] text-right', labelColor)}>{label ?? `${Math.round(pct)}%`}</p>
      <div className="h-[10px] w-full rounded-[15px] bg-amana-neutral-100 overflow-hidden">
        <div
          className={cn('h-full rounded-[15px] transition-[width] duration-300 ease-out', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
