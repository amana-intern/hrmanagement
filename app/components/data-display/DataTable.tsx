'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import SelectField from '@/app/components/forms/SelectField';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  /** Column width — a fixed px value, or a percentage so it grows/shrinks proportionally with the rest of the table. */
  width?: string;
  /** Minimum pixel floor counted into the table's own min-width, for a percentage `width` (a px `width` is already its own floor). */
  minPx?: number;
}

interface DataTableProps<T extends { id: number | string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  defaultSortKey?: keyof T;
  defaultSortDir?: 'asc' | 'desc';
  /** Tighter cell padding, for tables squeezed into a narrower column. */
  compact?: boolean;
  /** Opt-in pagination: rows are sorted as a whole, then sliced per page; renders the rows-per-page footer below the table. */
  pageSize?: number;
  /** Choices for the footer's rows-per-page selector. First entry is the initial value when `pageSize` is not given. */
  pageSizeOptions?: readonly number[];
  /** Fixed height of the table frame while paginated (Figma "Leave Table" spec). */
  tableHeight?: string;
}

const DEFAULT_PAGE_SIZES = [25, 50, 100] as const;

export default function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  emptyMessage = 'No records found.',
  defaultSortKey,
  defaultSortDir = 'asc',
  compact = false,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  tableHeight = '445.27px',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(pageSize ?? pageSizeOptions[0]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // New row set (filter/search/CRUD) → back to the first page.
  useEffect(() => {
    setPage(0);
  }, [rows]);

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

  const paginated = pageSize != null;
  const total = sorted.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(total / size)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * size;
  const paged = paginated ? sorted.slice(start, start + size) : sorted;
  const showingFrom = total === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + size, total);

  // Pindah halaman / ganti ukuran / baris baru → langsung kembali ke baris paling atas.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [safePage, size, rows]);

  const minColWidth = compact ? 80 : 96;
  const minTableWidth = columns.reduce(
    (sum, c) => sum + (c.minPx ?? (c.width?.endsWith('px') ? parseInt(c.width, 10) : minColWidth)),
    0
  );

  const table = (
    <table
      className="w-full table-fixed text-center border-separate border-spacing-0"
      style={{ minWidth: `${minTableWidth}px` }}
    >
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
        {paged.map((r, idx) => (
          <tr key={r.id} className="hover:bg-amana-primary-100 transition-colors duration-150">
            {columns.map((c, i) => (
              <td
                key={`${String(c.key)}-${i}`}
                title={c.render ? undefined : String(r[c.key])}
                className={cn(
                  'text-amana-neutral-500 text-center',
                  c.render ? 'overflow-visible' : 'truncate',
                  compact ? 'px-1.5 py-1.5 text-[14px]' : 'px-3 py-2.5 text-[16px]',
                  i < columns.length - 1 && 'border-r border-amana-neutral-300',
                  (idx < paged.length - 1 || paginated) && 'border-b border-amana-neutral-300'
                )}
              >
                {c.render ? c.render(r) : String(r[c.key])}
              </td>
            ))}
          </tr>
        ))}
        {total === 0 && (
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
  );

  if (!paginated) {
    return <div className="flex-1 min-h-0 overflow-auto">{table}</div>;
  }

  return (
    <>
      <div
        className="shrink-0 overflow-hidden rounded-[4.88px] bg-amana-neutral-100 pb-[19.51px]"
        style={{ height: tableHeight }}
      >
        <div ref={scrollRef} className="h-full overflow-auto">{table}</div>
      </div>
      <footer className="mt-5 flex w-full shrink-0 items-center justify-end gap-3 text-[14px] text-amana-primary-500">
        <div className="flex items-center gap-[5.05px]">
          <span>Rows per page:</span>
          <SelectField
            value={String(size)}
            onChange={(v) => {
              if (v) {
                setSize(Number(v));
                setPage(0);
              }
            }}
            options={pageSizeOptions.map(String)}
            inline
            inputClassName="w-[103px] h-[30.72px] rounded-[4.48px] border-[0.64px] border-[#CECFCF] bg-amana-neutral-100 px-[6.4px] py-[6.4px] pr-7 text-[10.24px] font-normal leading-none tracking-normal text-amana-primary-500"
          />
        </div>
        <div className="flex items-center gap-[5.05px]">
          <span className="font-medium">
            Showing {showingFrom}-{showingTo} of {total}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            title="Previous page"
            disabled={safePage <= 0}
            onClick={() => setPage(safePage - 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-amana-primary-500 transition-colors hover:bg-amana-primary-100 disabled:cursor-default disabled:text-amana-neutral-300 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            title="Next page"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
            className="flex h-7 w-7 items-center justify-center rounded text-amana-primary-500 transition-colors hover:bg-amana-primary-100 disabled:cursor-default disabled:text-amana-neutral-300 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </>
  );
}
