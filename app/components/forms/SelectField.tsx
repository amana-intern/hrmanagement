'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

// Same look & portal-dropdown behavior as ComboboxField (Chargecode) — type-to-filter box +
// floating option list. Unlike ComboboxField, `value` only ever changes when an option is
// clicked (typing just filters), since this backs closed-set fields tied to real business logic
// (Contract Type, Access, Grade, ...), not a quasi-free-text value like a chargecode.
export default function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = 'Select...',
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
  placeholder?: string;
  /** Optional display label per option value (e.g. for meta values like "__other__"). */
  labels?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const display = (o: string) => labels?.[o] ?? o;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => display(o).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, labels, query]);

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
      setQuery('');
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openDropdown = () => {
    if (disabled || open) return;
    const q = value ? display(value) : '';
    setQuery(q);
    // Opsi aktif default: nilai saat ini bila masih ada di hasil filter, else opsi pertama.
    const list = q ? options.filter((o) => display(o).toLowerCase().includes(q.toLowerCase())) : options;
    const i = list.indexOf(value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };

  const pick = (o: string) => {
    onChange(o);
    setOpen(false);
    setQuery('');
  };

  // Opsi aktif (untuk navigasi keyboard): indeks ke `filtered`, selalu di-clamp agar valid.
  const activeIdx = active < filtered.length ? active : 0;

  // Jaga opsi aktif selalu terlihat saat navigasi keyboard (arrow) — scroll panel saja
  // (block: 'nearest' = no-op bila sudah terlihat, tak mengguncang halaman).
  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        openDropdown();
      } else if (e.key === 'ArrowDown') {
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else {
        setActive((a) => Math.max(a - 1, 0));
      }
    } else if (e.key === 'Enter') {
      if (open && filtered.length > 0) {
        e.preventDefault();
        pick(filtered[activeIdx]);
      }
    } else if (e.key === 'Tab') {
      // Tab saat dropdown terbuka = pilih opsi aktif; fokus tetap lanjut normal (tanpa preventDefault).
      if (open) {
        if (filtered.length > 0) pick(filtered[activeIdx]);
        else {
          setOpen(false);
          setQuery('');
        }
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setQuery('');
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <div className="relative">
        <input
          ref={triggerRef}
          type="text"
          value={open ? query : value ? display(value) : ''}
          onChange={(e) => {
            const t = e.target.value;
            setQuery(t);
            setActive(0);
            if (!open) setOpen(true);
            // Konsisten dgn ComboboxField (Chargecode): teks yang tak persis sama dgn
            // display(value) berarti pengguna menghapus/mengubah input → nilai tersimpan
            // dibersihkan (highlight opsi ikut hilang, what-you-see = what-is-stored).
            if (value && t !== display(value)) onChange('');
          }}
          onMouseDown={openDropdown}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 pr-9 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 disabled:bg-amana-neutral-200 disabled:text-amana-neutral-400 disabled:cursor-not-allowed"
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
            filtered.map((o, i) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                onMouseEnter={() => setActive(i)}
                data-active={i === activeIdx ? 'true' : undefined}
                className={`w-full text-left px-2 py-1.5 rounded text-[14px] transition-colors ${
                  o === value
                    ? 'bg-amana-primary-500 text-white'
                    : i === activeIdx
                      ? 'bg-amana-primary-100 text-amana-neutral-500'
                      : 'text-amana-neutral-500 hover:bg-amana-primary-100'
                }`}
              >
                {display(o)}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
