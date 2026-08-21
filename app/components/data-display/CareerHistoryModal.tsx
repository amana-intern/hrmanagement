'use client';

import Modal from '../feedback/Modal';

export interface CareerHistoryChange {
  field: string;
  from: string;
  to: string;
}

export interface CareerHistoryEntry {
  idAudit: string;
  aktorNama: string | null;
  waktu: string | null;
  perubahan: CareerHistoryChange[] | null;
}

function formatHistoryDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'long' });
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${d.getDate()} ${month} ${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;
}

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
  return (
    <Modal title="Career History" onClose={onClose} maxWidth="max-w-2xl" className="max-h-[90vh]">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 flex flex-col gap-3">
        <h4 className="flex-shrink-0 text-[18px] font-semibold text-amana-primary-500 pb-1.5 border-b border-amana-primary-500">
          {employeeName}
        </h4>

        {loading ? (
          <p className="text-[14px] text-amana-neutral-400">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-[14px] text-amana-neutral-400">No history recorded yet.</p>
        ) : (
          history.map((entry) => (
            <div key={entry.idAudit} className="p-3 rounded-[5px] border border-amana-neutral-300 bg-amana-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-amana-neutral-400">by {entry.aktorNama ?? '-'}</span>
                <span className="text-[13px] text-amana-neutral-400">{formatHistoryDate(entry.waktu)}</span>
              </div>
              <div className="flex flex-col gap-1">
                {(entry.perubahan ?? []).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[14px]">
                    <span className="font-semibold text-amana-primary-500 flex-shrink-0">{c.field}</span>
                    <span className="text-amana-neutral-500">
                      {c.from} <span aria-hidden>→</span> <span className="font-semibold">{c.to}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
