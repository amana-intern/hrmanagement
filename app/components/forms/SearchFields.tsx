'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateWIB } from '@/app/utils/formatDate';

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

function addMonths(d: Date, n: number): Date {
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

function CalendarMonth({
  month,
  fromValue,
  toValue,
  onPick,
  onPrev,
  onNext,
  onSetMonth,
}: {
  month: Date;
  fromValue: string;
  toValue: string;
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
          className={`p-1 rounded text-amana-neutral-400 hover:bg-white flex-shrink-0 ${onPrev ? '' : 'invisible'}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <MonthYearLabel month={month} onSetMonth={onSetMonth} />
        <button
          type="button"
          onClick={onNext}
          className={`p-1 rounded text-amana-neutral-400 hover:bg-white flex-shrink-0 ${onNext ? '' : 'invisible'}`}
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
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              className={[
                'text-[13px] aspect-square w-full rounded-full flex items-center justify-center transition-colors',
                isFrom || isTo
                  ? 'bg-amana-primary-500 text-white font-semibold'
                  : inRange
                    ? 'bg-amana-primary-200/30 text-amana-neutral-500'
                    : inMonth
                      ? 'text-amana-neutral-500 hover:bg-white'
                      : 'text-amana-neutral-300 hover:bg-white',
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
}: {
  label: string;
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => {
    const base = parseISODate(fromValue) ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Panel is portal'd to <body> so it can escape SearchPanel's animated overflow:hidden wrapper.
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

  const handlePick = (iso: string) => {
    if (!fromValue || toValue) {
      onFromChange(iso);
      onToChange('');
    } else if (iso < fromValue) {
      onFromChange(iso);
    } else {
      onToChange(iso);
      setOpen(false);
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
        <ChevronDown
          className={`w-4 h-4 text-amana-neutral-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
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
              onPick={handlePick}
              onPrev={() => setLeftMonth((m) => addMonths(m, -1))}
              onSetMonth={(m) => setLeftMonth(m)}
            />
            <div className="w-px self-stretch bg-amana-neutral-200" />
            <CalendarMonth
              month={addMonths(leftMonth, 1)}
              fromValue={fromValue}
              toValue={toValue}
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
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 pr-9 text-[16px] text-amana-neutral-500 bg-transparent transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-amana-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
