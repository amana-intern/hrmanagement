'use client';

import Modal from '../feedback/Modal';
import { DEPARTMENT_LABEL } from '@/lib/roles';
import { formatDateTimeWIB } from '@/app/utils/formatDate';

export interface CareerHistoryItem {
  idHistory: string;
  tipe: string | null;
  nilaiLama: string | null;
  nilaiBaru: string | null;
  diubahOleh: string | null;
  createdAt: string | Date | null;
}

const TIPE_LABEL: Record<string, string> = {
  DEPARTMENT: 'Department Transfer',
  GRADE: 'Grade Transfer',
  ROLE: 'Role Change',
};

function displayValue(tipe: string | null, value: string | null): string {
  const v = value || '-';
  if (tipe === 'DEPARTMENT') {
    return DEPARTMENT_LABEL[v] ?? v;
  }
  return v;
}

function formatDate(value: string | Date | null): string {
  return formatDateTimeWIB(value);
}

function groupByTime(items: CareerHistoryItem[]): CareerHistoryItem[][] {
  const groups: CareerHistoryItem[][] = [];
  let lastKey: number | null = null;
  for (const item of items) {
    const d = item.createdAt ? new Date(item.createdAt) : null;
    const key = d && !Number.isNaN(d.getTime()) ? d.getTime() : null;
    if (key !== null && key === lastKey && groups.length > 0) {
      groups[groups.length - 1].push(item);
    } else {
      groups.push([item]);
    }
    lastKey = key;
  }
  return groups;
}

interface CareerHistoryModalProps {
  employeeName: string;
  history: CareerHistoryItem[];
  loading?: boolean;
  onClose: () => void;
}

export default function CareerHistoryModal({
  employeeName,
  history,
  loading = false,
  onClose,
}: CareerHistoryModalProps) {
  return (
    <Modal title="Career History" onClose={onClose} maxWidth="max-w-4xl" className="max-h-[90vh]">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5">
        <h3 className="flex-shrink-0 text-[18px] font-semibold text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
          {employeeName}
        </h3>

        {loading ? (
          <p className="text-[14px] text-amana-neutral-400">Loading career history...</p>
        ) : history.length === 0 ? (
          <p className="text-[14px] text-amana-neutral-400">No career history available.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {groupByTime(history).map((group, gi) => (
              <div
                key={gi}
                className="flex flex-col gap-2 bg-amana-neutral-100 rounded-[8px] border border-amana-primary-500 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3 text-[13px] text-amana-neutral-400">
                  <span>{group[0].diubahOleh ? `by ${group[0].diubahOleh}` : ''}</span>
                  <span className="whitespace-nowrap">{formatDate(group[0].createdAt)}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {group.map((item) => (
                    <div
                      key={item.idHistory}
                      className="flex flex-col sm:flex-row sm:items-baseline gap-x-3 gap-y-0.5 text-[15px]"
                    >
                      <span className="w-[160px] flex-shrink-0 text-[14px] font-semibold text-amana-primary-500">
                        {TIPE_LABEL[item.tipe ?? ''] ?? item.tipe ?? '-'}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-x-2 text-amana-neutral-500">
                        <span className="min-w-0 break-words">{displayValue(item.tipe, item.nilaiLama)}</span>
                        <span className="flex-shrink-0 text-amana-primary-500">→</span>
                        <span className="min-w-0 break-words font-medium text-amana-neutral-700">
                          {displayValue(item.tipe, item.nilaiBaru)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
