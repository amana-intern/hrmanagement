'use client';

import { CircleDot, ChevronRight } from 'lucide-react';
import Modal from '../feedback/Modal';
import { formatDateTimeWIB } from '@/app/utils/formatDate';

export interface CareerHistoryChange {
  field: string;
  from: string;
  to: string;
}

export interface CareerHistoryEntry {
  id: string;
  aktor: string | null;
  waktu: string | null;
  changes: CareerHistoryChange[] | null;
}

const FIELD_LABELS: Record<string, string> = {
  DEPARTMENT: 'Practice Group',
  GRADE: 'Grade',
  ROLE: 'Role',
};

export default function CareerHistoryModal({
  employeeName,
  history,
  loading,
  onClose,
}: {
  employeeName: string;
  history: CareerHistoryEntry[];
  loading: boolean;
  onClose: () => void;
}) {
  const rows = history.flatMap((entry) =>
    (entry.changes ?? []).map((c, i) => ({
      key: `${entry.id}-${i}`,
      aktor: entry.aktor,
      waktu: entry.waktu,
      label: FIELD_LABELS[c.field] ?? c.field,
      from: c.from,
      to: c.to,
    }))
  );

  return (
    <Modal title={`Career History - ${employeeName}`} onClose={onClose} maxWidth="max-w-2xl" className="max-h-[90vh]">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col">
        {loading ? (
          <p className="text-[14px] text-amana-neutral-400">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-[14px] text-amana-neutral-400">No history recorded yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="flex items-stretch gap-2 py-3 border-b border-amana-primary-500">
              <div className="flex flex-col items-center flex-shrink-0 w-[12px] pt-1">
                <CircleDot className="w-[12px] h-[12px] text-amana-primary-500 flex-shrink-0" strokeWidth={1.5} />
                <div className="flex-1 w-px bg-amana-primary-500 mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-amana-neutral-300">
                  Changed by {row.aktor ?? '-'}, {formatDateTimeWIB(row.waktu)}
                </p>
                <p className="text-[24px] font-semibold italic text-amana-primary-500">{row.label}</p>
                <div className="flex items-center gap-1 text-[16px] text-amana-neutral-500">
                  <span>{row.from || '-'}</span>
                  <ChevronRight className="w-5 h-5 text-amana-primary-500 flex-shrink-0" />
                  <span>{row.to || '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
