'use client';

import { ReactNode, useMemo, useState } from 'react';
import { ChevronDown, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { durationFast, easeOut } from '@/app/utils/motion';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  /** Fixed column width (e.g. '190px'), for columns that need more room than an equal split gives them. */
  width?: string;
}

interface DataTableProps<T extends { id: number | string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  defaultSortKey?: keyof T;
  defaultSortDir?: 'asc' | 'desc';
  /** Tighter cell padding, for tables squeezed into a narrower column. */
  compact?: boolean;
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  emptyMessage = 'No records found.',
  defaultSortKey,
  defaultSortDir = 'asc',
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);

  const toggleSort = (key: keyof T) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    const getValue =
      col?.sortValue ??
      ((r: T) => {
        const v = r[sortKey];
        return typeof v === 'string' ? v.toLowerCase() : (v as unknown as number);
      });
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir, columns]);

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="w-full table-fixed text-center border-collapse">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={`${String(c.key)}-${i}`}
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  compact ? 'px-1.5 pb-1.5' : 'px-3 pb-2',
                  'border-b border-amana-neutral-300 sticky top-0 bg-amana-neutral-100 text-center',
                  i < columns.length - 1 && 'border-r'
                )}
              >
                <button
                  onClick={() => toggleSort(c.key)}
                  className="relative block w-full cursor-pointer hover:opacity-80"
                >
                  <span
                    className={cn(
                      'block break-words text-center pr-5 font-semibold text-amana-primary-500',
                      compact ? 'text-[14px]' : 'text-[16px]'
                    )}
                  >
                    {c.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 flex-shrink-0 transition-transform absolute top-0.5 right-0',
                      sortKey === c.key && sortDir === 'desc' && 'rotate-180',
                      sortKey !== c.key && 'text-amana-neutral-300'
                    )}
                  />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => (
            <motion.tr
              key={r.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durationFast, ease: easeOut, delay: Math.min(idx, 15) * 0.02 }}
            >
              {columns.map((c, i) => (
                <td
                  key={`${String(c.key)}-${i}`}
                  title={c.render ? undefined : String(r[c.key])}
                  className={cn(
                    'text-amana-neutral-500 text-center',
                    c.render ? 'overflow-visible' : 'truncate',
                    compact ? 'px-1.5 py-1.5 text-[14px]' : 'px-3 py-2.5 text-[16px]',
                    i < columns.length - 1 && 'border-r border-amana-neutral-300',
                    idx < sorted.length - 1 && 'border-b border-amana-neutral-300'
                  )}
                >
                  {c.render ? c.render(r) : String(r[c.key])}
                </td>
              ))}
            </motion.tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center text-amana-neutral-400 text-[16px]">
                <div className="flex flex-col items-center gap-2">
                  <Inbox className="w-9 h-9 text-amana-primary-300" strokeWidth={1.5} />
                  {emptyMessage}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
