'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { formatDateWIB } from '@/app/utils/formatDate';
import { CalendarMonth, addMonths } from './SearchFields';

// Single-date counterpart to SearchDateRangeCalendarField — same portal'd calendar-dropdown
// look, but picks one date and closes immediately (no From/To). For any form field that only
// needs one date (e.g. "Payment Date" in Schedule Payment), instead of a native <input type="date">.
export default function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Tanggal sebelum ini (YYYY-MM-DD) tidak bisa dipilih. */
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [month, setMonth] = useState(() => {
    const base = value ? new Date(value + 'T00:00:00') : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fixed compact width — a single month doesn't need to stretch to the trigger's own width.
  const PANEL_WIDTH = 300;

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      // Day-row height is fixed (not tied to width) so the height estimate here is a constant.
      // Clamp `top`/`left` so the panel always fits fully on screen — prefer below, flip above,
      // or nudge into view; never a scrollbar mid-month.
      const heightEstimate = 290;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const openUp = spaceBelow < heightEstimate && spaceAbove > spaceBelow;
      const rawTop = openUp ? r.top - 4 - heightEstimate : r.bottom + 4;
      const top = Math.max(8, Math.min(rawTop, window.innerHeight - heightEstimate - 8));
      const left = Math.max(8, Math.min(r.left, window.innerWidth - PANEL_WIDTH - 8));
      setPos({ top, left });
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
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-left bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
      >
        <span className={value ? 'text-amana-neutral-500' : 'text-amana-neutral-300'}>
          {value ? formatDateWIB(value) : placeholder}
        </span>
        <ChevronRight className={`w-4 h-4 text-amana-neutral-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_WIDTH }}
          className="z-50 bg-amana-neutral-100 border border-amana-primary-500 rounded-[8px] shadow-lg p-3"
        >
          <CalendarMonth
            month={month}
            fromValue={value}
            toValue={value}
            minDate={minDate}
            onPick={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            onPrev={() => setMonth((m) => addMonths(m, -1))}
            onNext={() => setMonth((m) => addMonths(m, 1))}
            onSetMonth={(m) => setMonth(m)}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
