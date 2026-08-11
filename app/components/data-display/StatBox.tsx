'use client';

import { Clock as ClockIcon } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export interface Stat {
  value: number | string;
  label: string;
  caption: string;
}

/** Bordered stat card: label header, big number in a colored pill with a clock icon, caption below. */
export default function StatBox({ value, label, caption }: Stat) {
  return (
    <div className="flex-1 min-w-0 border border-amana-primary-500 rounded-[8px] px-3 py-2">
      <div className="text-[16px] font-semibold text-amana-neutral-500 border-b border-amana-neutral-500 pb-1 mb-1 line-clamp-2 leading-tight">
        {label}
      </div>
      <div className="bg-amana-danger-200 rounded-[12px] px-2.5 py-1.5 flex items-center justify-between">
        <span className="text-[27px] font-semibold text-amana-danger-500 leading-none">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </span>
        <ClockIcon className="w-6 h-6 text-amana-danger-500 flex-shrink-0" />
      </div>
      <div className="text-[9px] leading-tight text-amana-neutral-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {caption}
      </div>
    </div>
  );
}
