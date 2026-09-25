'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateWIB } from '@/app/utils/formatDate';
import SelectField from './SelectField';

export function SearchTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
      />
    </div>
  );
}

// Grouped "From"/"To" date range under one label, e.g. "Contract Sign Date" (Figma node 970:2100).
export function SearchDateRangeField({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
}: {
  label: string;
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <div className="flex items-center gap-3">
        <span className="flex-1 min-w-0 text-[12px] text-amana-neutral-400">From</span>
        <span className="flex-1 min-w-0 text-[12px] text-amana-neutral-400">To</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
          className="flex-1 min-w-0 border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
        />
        <input
          type="date"
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
          className="flex-1 min-w-0 border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
        />
      </div>
    </div>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// 6 baris x 7 kolom, mulai Senin, termasuk tanggal bulan sebelum/sesudahnya agar grid selalu penuh.
function generateGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const leadingBlanks = (first.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - leadingBlanks);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

// Klik label "Month Year" untuk ganti langsung lewat dropdown bulan + input tahun, tanpa harus next/prev berkali-kali.
function MonthYearLabel({ month, onSetMonth }: { month: Date; onSetMonth: (m: Date) => void }) {
  const [editing, setEditing] = useState(false);
  const [yearDraft, setYearDraft] = useState(String(month.getFullYear()));

  useEffect(() => {
    setYearDraft(String(month.getFullYear()));
  }, [month]);

  if (editing) {
    return (
      <div
        className="flex items-center justify-center gap-1 min-w-0"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setEditing(false);
        }}
      >
        <select
          autoFocus
          value={month.getMonth()}
          onChange={(e) => onSetMonth(new Date(month.getFullYear(), Number(e.target.value), 1))}
          className="min-w-0 bg-transparent text-[13px] font-semibold text-amana-neutral-500 border border-amana-neutral-300 rounded px-1 py-0.5 focus:outline-none focus:border-amana-primary-500"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="numeric"
          value={yearDraft}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
            setYearDraft(v);
            if (v.length === 4) onSetMonth(new Date(Number(v), month.getMonth(), 1));
          }}
          className="w-14 bg-transparent text-[13px] font-semibold text-amana-neutral-500 border border-amana-neutral-300 rounded px-1 py-0.5 focus:outline-none focus:border-amana-primary-500"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-[14px] font-semibold text-amana-neutral-500 hover:text-amana-primary-500"
    >
      {MONTH_ABBR[month.getMonth()]} {month.getFullYear()}
    </button>
  );
}

export function CalendarMonth({
  month,
  fromValue,
  toValue,
  onPick,
  onPrev,
  onNext,
  onSetMonth,
  minDate,
}: {
  month: Date;
  fromValue: string;
  toValue: string;
  /** Tanggal sebelum ini (YYYY-MM-DD) tidak bisa dipilih. */
  minDate?: string;
  onPick: (iso: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSetMonth: (m: Date) => void;
}) {
  const days = useMemo(() => generateGrid(month), [month]);
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={onPrev}
          className={`p-1 rounded text-amana-neutral-400 hover:bg-amana-primary-100 flex-shrink-0 ${onPrev ? '' : 'invisible'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <MonthYearLabel month={month} onSetMonth={onSetMonth} />
        <button
          type="button"
          onClick={onNext}
          className={`p-1 rounded text-amana-neutral-400 hover:bg-amana-primary-100 flex-shrink-0 ${onNext ? '' : 'invisible'}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="text-[11px] font-medium text-amana-neutral-400 text-center">
            {w}
          </span>
        ))}
        {days.map((date) => {
          const iso = toISODate(date);
          const inMonth = date.getMonth() === month.getMonth();
          const isFrom = !!fromValue && fromValue === iso;
          const isTo = !!toValue && toValue === iso;
          const inRange = !!fromValue && !!toValue && iso > fromValue && iso < toValue;
          const disabled = !!minDate && iso < minDate;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              className={[
                'text-[13px] h-8 w-full rounded-full flex items-center justify-center transition-colors',
                disabled
                  ? 'text-amana-neutral-200 cursor-not-allowed line-through'
                  : isFrom || isTo
                  ? 'bg-amana-primary-500 text-white font-semibold'
                  : inRange
                    ? 'bg-amana-primary-200/30 text-amana-neutral-500'
                    : inMonth
                      ? 'text-amana-neutral-500 hover:bg-amana-primary-100'
                      : 'text-amana-neutral-300 hover:bg-amana-primary-100',
              ].join(' ')}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dropdown trigger + kalender dua-bulan untuk memilih rentang From/To (Figma node 977:2174).
export function SearchDateRangeCalendarField({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  minDate,
}: {
  label: string;
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  /** Tanggal sebelum ini (YYYY-MM-DD) tidak bisa dipilih, mis. hari ini untuk pengajuan baru. */
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => {
    const base = parseISODate(fromValue) ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fixed compact width — two months don't need to stretch to the trigger's own (often much
  // wider) width. Kept modest so it doesn't overhang neighboring fields in a narrow SearchPanel grid.
  const PANEL_WIDTH = 420;

  // Panel is portal'd to <body> so it can escape SearchPanel's animated overflow:hidden wrapper.
  // Height is a constant (day rows are a fixed h-8, not tied to width) — clamp `top`/`left` so the
  // whole two-month panel always fits on screen (prefer below, flip above, or nudge into view).
  useEffect(() => {
    if (!open) return;
    const HEIGHT_ESTIMATE = 330;
    const update = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const openUp = spaceBelow < HEIGHT_ESTIMATE && spaceAbove > spaceBelow;
      const rawTop = openUp ? r.top - 4 - HEIGHT_ESTIMATE : r.bottom + 4;
      const top = Math.max(8, Math.min(rawTop, window.innerHeight - HEIGHT_ESTIMATE - 8));
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

  const handlePick = (iso: string) => {
    if (!fromValue || toValue) {
      onFromChange(iso);
      onToChange('');
    } else if (iso < fromValue) {
      onFromChange(iso);
    } else {
      onToChange(iso);
    }
  };

  const displayText = fromValue
    ? `${formatDateWIB(fromValue)}${toValue ? ` - ${formatDateWIB(toValue)}` : ''}`
    : 'Select date';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-left transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
      >
        <span className={`truncate ${fromValue ? 'text-amana-neutral-500' : 'text-amana-neutral-300'}`}>
          {displayText}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-amana-neutral-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_WIDTH }}
          className="z-50 bg-amana-neutral-100 border border-amana-primary-500 rounded-[8px] shadow-lg p-4"
        >
          <div className="flex items-center gap-4 pb-2 mb-2 border-b border-amana-primary-500 text-[12px] text-amana-neutral-400">
            <span className="flex-1 text-center">From</span>
            <span className="flex-1 text-center">To</span>
          </div>
          <div className="flex items-start gap-4">
            <CalendarMonth
              month={leftMonth}
              fromValue={fromValue}
              toValue={toValue}
              minDate={minDate}
              onPick={handlePick}
              onPrev={() => setLeftMonth((m) => addMonths(m, -1))}
              onSetMonth={(m) => setLeftMonth(m)}
            />
            <div className="w-px self-stretch bg-amana-neutral-200" />
            <CalendarMonth
              month={addMonths(leftMonth, 1)}
              fromValue={fromValue}
              toValue={toValue}
              minDate={minDate}
              onPick={handlePick}
              onNext={() => setLeftMonth((m) => addMonths(m, 1))}
              onSetMonth={(m) => setLeftMonth(addMonths(m, -1))}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function SearchSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={(v) => onChange(v === 'All' ? '' : v)}
      options={['All', ...options]}
      placeholder="All"
    />
  );
}
