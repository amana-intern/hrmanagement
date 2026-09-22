'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/utils/cn';

export default function SectionCard({
  title,
  subtitle,
  action,
  scroll = false,
  as = 'div',
  onSubmit,
  className,
  children,
}: {
  title?: string;
  /** Muted line under the title, e.g. "Please update your latest CV". */
  subtitle?: string;
  action?: ReactNode;
  /** Use for cards wrapping a DataTable that should grow/shrink and scroll internally. */
  scroll?: boolean;
  /** Render as a <form> when the card's content is itself the submittable form. */
  as?: 'div' | 'form';
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag
      onSubmit={as === 'form' ? onSubmit : undefined}
      className={cn(
        scroll ? 'min-h-0 flex flex-col' : 'flex-shrink-0',
        'bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5',
        className
      )}
    >
      {title && (
        <div className="flex-shrink-0 flex items-start justify-between pb-1.5 mb-2 border-b border-amana-primary-500">
          <div>
            <h3 className="text-[20px] font-semibold text-amana-primary-500">{title}</h3>
            {subtitle && <p className="text-[13px] text-amana-neutral-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}
