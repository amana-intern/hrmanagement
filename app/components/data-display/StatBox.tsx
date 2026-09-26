'use client';

import { Clock as ClockIcon } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export type StatTone = 'danger' | 'warning' | 'success';

export interface Stat {
  value: number | string;
  label: string;
  caption: string;
  onClick?: () => void;
  /** Warna pill (default 'danger' / merah). */
  tone?: StatTone;
}

const TONE_CLASSES: Record<StatTone, { pill: string; text: string; icon: string; hover: string }> = {
  danger: {
    pill: 'bg-amana-danger-200',
    text: 'text-amana-danger-500',
    icon: 'text-amana-danger-500',
    hover: 'hover:text-amana-danger-700',
  },
  warning: {
    pill: 'bg-amana-warning-200',
    text: 'text-amana-warning-500',
    icon: 'text-amana-warning-500',
    hover: 'hover:text-amana-warning-700',
  },
  success: {
    pill: 'bg-amana-success-200',
    text: 'text-amana-success-500',
    icon: 'text-amana-success-500',
    hover: 'hover:text-amana-success-700',
  },
};

/** Bordered stat card: label header, big number in a colored pill with a clock icon, caption below. */
export default function StatBox({ value, label, caption, onClick, tone = 'danger' }: Stat) {
  const c = TONE_CLASSES[tone];
  return (
    <div className="flex-1 min-w-0 border border-amana-primary-500 rounded-[5px] px-3 py-2">
      <div className="text-[16px] font-semibold text-amana-neutral-500 border-b border-amana-neutral-500 pb-1 mb-1 line-clamp-2 leading-tight">
        {label}
      </div>
      <div className={`${c.pill} rounded-[8px] px-2.5 py-1.5 flex items-center justify-between`}>
        <span className={`text-[27px] font-semibold ${c.text} leading-none`}>
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </span>
        <ClockIcon
          className={`w-6 h-6 ${c.icon} flex-shrink-0 ${onClick ? `cursor-pointer ${c.hover}` : ''}`}
          onClick={onClick}
        />
      </div>
      <div className="text-[9px] leading-tight text-amana-neutral-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {caption}
      </div>
    </div>
  );
}
