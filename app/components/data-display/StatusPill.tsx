'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/utils/cn';

// Maps each solid `bg-amana-*-500` color callers already pass in to the soft-tint
// badge recipe (Figma node 662:7036): light 300-tint fill, 500 border, 500 text.
// Written as literal classes (not derived from `color` at runtime) so Tailwind's
// scanner can see and generate them.
const SOFT_STYLES: Record<string, string> = {
  'bg-amana-success-500': 'bg-amana-success-300 border-amana-success-500 text-amana-success-500',
  'bg-amana-danger-500': 'bg-amana-danger-300 border-amana-danger-500 text-amana-danger-500',
  'bg-amana-warning-500': 'bg-amana-warning-300 border-amana-warning-500 text-amana-warning-500',
  'bg-amana-primary-500': 'bg-amana-primary-300 border-amana-primary-500 text-amana-primary-500',
  'bg-amana-neutral-400': 'bg-amana-neutral-300 border-amana-neutral-400 text-amana-neutral-500',
};

/** Colored status badge. Defaults to filling its DataTable cell; pass fullWidth={false} for an inline compact chip. Pass a bg-amana-*-500 class as `color`. */
export default function StatusPill({ color, fullWidth = true, children }: { color: string; fullWidth?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'block text-center px-2 py-1 rounded-full border text-[13px] whitespace-nowrap transition-colors duration-500 ease-in-out',
        fullWidth ? 'w-full' : 'w-[110px]',
        SOFT_STYLES[color] ?? SOFT_STYLES['bg-amana-neutral-400']
      )}
    >
      {children}
    </span>
  );
}
