'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import Collapse from '../layout/Collapse';

/** Collapsible single-field search box (title/subtitle + toggle icon), as used by Talent Roster and Job Listing. */
export default function QuickSearchBox({
  title,
  subtitle,
  query,
  onQueryChange,
  onSearch,
  placeholder,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  placeholder?: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="flex-shrink-0 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
      <button onClick={onToggle} className="flex items-center gap-2 w-full text-left cursor-pointer">
        <div className="flex-1">
          <h3 className="text-[20px] font-semibold text-amana-primary-500">{title}</h3>
          <p className="text-[13px] text-amana-neutral-400">{subtitle}</p>
        </div>
        <Search className="w-6 h-6 text-amana-primary-500 flex-shrink-0" />
      </button>

      {/* Input + children (mis. hasil search AI) dalam satu Collapse —
          menutup fitur ikut menutup result, bukan hanya text fieldnya. */}
      <Collapse open={open}>
        <div className="pt-3 mt-2 border-t border-amana-primary-500">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={placeholder}
            className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
          />
        </div>

        {children}
      </Collapse>
    </div>
  );
}
