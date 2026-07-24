'use client';

import Button from '../forms/Button';

export interface ApprovalTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export function statusVariant(s: string) {
  if (s === 'Approved') return 'approved' as const;
  if (s === 'Rejected') return 'rejected' as const;
  if (s === 'Pending Ops' || s === 'Pending Partner') return 'pending' as const;
  return 'pending' as const;
}

export default function ApprovalTable<T extends { id: string | number; status: string }>({
  columns,
  data,
  renderRow,
  onApprove,
  onReject,
  pendingStatus = 'Pending',
  doneLabel = 'Done',
}: {
  columns: ApprovalTableColumn[];
  data: T[];
  renderRow: (item: T) => React.ReactNode[];
  onApprove: (id: T['id']) => void;
  onReject: (id: T['id']) => void;
  pendingStatus?: string;
  doneLabel?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-amana-sec-6 shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-amana-blue to-amana-sec-5 text-amana-white text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-4 font-semibold whitespace-nowrap text-sm ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              <th className="p-4 font-semibold whitespace-nowrap text-sm text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amana-sec-6/60">
            {data.map((item) => {
              const cells = renderRow(item);
              return (
                <tr key={item.id} className="hover:bg-amana-blue/[0.03] transition-colors duration-200">
                  {cells.map((cell, i) => (
                    <td key={i} className="p-4">{cell}</td>
                  ))}
                  <td className="p-4 text-center">
                    <div className="min-w-[200px]">
                      {item.status === pendingStatus ? (
                        <div className="flex gap-2 justify-center">
                          <Button variant="primary" onClick={() => onApprove(item.id)}>Approve</Button>
                          <Button variant="secondary" onClick={() => onReject(item.id)}>Reject</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-amana-sec-7 italic block text-center">{doneLabel}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
