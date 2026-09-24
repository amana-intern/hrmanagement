'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

// Type-or-pick combobox: text input + filtered dropdown, styled like SearchDateRangeCalendarField's
// portal'd panel (SearchFields.tsx) instead of the browser's native <datalist> popup.
export default function ComboboxField({
  label,
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  /** Optional display label per option value. */
  labels?: Record<string, string>;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q) || (labels?.[o] ?? '').toLowerCase().includes(q));
  }, [options, labels, value]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <div className="relative">
        <input
          ref={triggerRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 pr-9 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
        />
        <ChevronRight
          className={`w-4 h-4 text-amana-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </div>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-50 bg-amana-neutral-100 border border-amana-primary-500 rounded-[8px] shadow-lg p-2 max-h-64 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-[14px] text-amana-neutral-400">No match found.</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-[14px] transition-colors ${
                  o === value ? 'bg-amana-primary-500 text-white' : 'text-amana-neutral-500 hover:bg-amana-primary-100'
                }`}
              >
                {labels?.[o] ?? o}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
