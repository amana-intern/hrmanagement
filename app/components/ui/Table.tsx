import { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

interface TableProps {
  columns: Column[];
  children: ReactNode;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className="inline-flex flex-col ml-1.5 -space-y-1">
      <svg className={`w-2.5 h-2.5 ${active && dir === 'asc' ? 'text-amana-white' : 'text-amana-white/40'}`} fill="currentColor" viewBox="0 0 10 6">
        <path d="M5 0L10 6H0z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${active && dir === 'desc' ? 'text-amana-white' : 'text-amana-white/40'}`} fill="currentColor" viewBox="0 0 10 6">
        <path d="M5 6L0 0h10z" />
      </svg>
    </span>
  );
}

export function TableHeader({ columns, sortKey, sortDir, onSort }: { columns: Column[]; sortKey?: string; sortDir?: 'asc' | 'desc'; onSort?: (key: string) => void }) {
  return (
    <thead>
      <tr className="bg-gradient-to-r from-amana-blue to-amana-sec-5 text-amana-white text-left">
        {columns.map((col) => (
          <th
            key={col.key}
            className={`p-4 font-semibold whitespace-nowrap text-sm ${
              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
            } ${col.sortable ? 'cursor-pointer select-none hover:brightness-110 transition-all' : ''}`}
            style={col.width ? { width: col.width } : undefined}
            onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
          >
            <span className="inline-flex items-center">
              {col.label}
              {col.sortable && <SortIcon active={sortKey === col.key} dir={sortKey === col.key ? sortDir || 'asc' : 'asc'} />}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default function Table({ columns, children, sortKey, sortDir, onSort }: TableProps) {
  return (
    <div
      className="bg-white rounded-2xl border border-amana-sec-6 shadow-sm overflow-hidden
                  hover:shadow-xl transition-shadow duration-300"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TableHeader columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <tbody className="divide-y divide-amana-sec-6/60">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}