'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/utils/cn';

/** Colored status badge. Defaults to filling its DataTable cell; pass fullWidth={false} for an inline compact chip. Pass a bg-amana-*-500 class as `color`. */
export default function StatusPill({ color, fullWidth = true, children }: { color: string; fullWidth?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'block text-center px-2 py-1 rounded-full text-[13px] text-amana-neutral-100 whitespace-nowrap transition-colors duration-500 ease-in-out',
        fullWidth ? 'w-full' : 'w-[110px]',
        color
      )}
    >
      {children}
    </span>
  );
}
