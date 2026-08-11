'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import Button from '../forms/Button';
import Collapse from '../layout/Collapse';

export default function SearchPanel({
  title,
  subtitle,
  children,
  onReset,
  onSearch,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onReset: () => void;
  onSearch: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex-shrink-0 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 w-full text-left cursor-pointer">
        <div className="flex-1">
          <h3 className="text-[20px] font-semibold text-amana-primary-500">{title}</h3>
          {subtitle && <p className="text-[13px] text-amana-neutral-400">{subtitle}</p>}
        </div>
        <ChevronDown
          className={cn('w-5 h-5 text-amana-primary-500 transition-transform flex-shrink-0', !open && '-rotate-90')}
        />
      </button>

      <Collapse open={open}>
        <div className="pt-3 mt-2 border-t border-amana-primary-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">{children}</div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onReset}
              className="px-8 py-3 rounded-lg border border-amana-primary-500 bg-amana-neutral-100 text-amana-primary-500 font-semibold text-base hover:bg-amana-primary-500 hover:text-amana-neutral-100"
            >
              Reset
            </button>
            <Button variant="primary" size="lg" onClick={onSearch}>
              Search
            </Button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}
