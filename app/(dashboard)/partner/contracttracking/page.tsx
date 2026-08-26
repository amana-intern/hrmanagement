'use client';

import { useEffect, useState } from 'react';
import ContractTrackingPage from '@/app/components/data-display/ContractTrackingPage';
import type { Contract } from '@/app/components/data-display/ContractTrackingPage';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import { DEPARTMENT_LABELS } from '@/lib/constants';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  daysLeft: number | null;
}

export default function PartnerContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusState | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/hr/contracts', { cache: 'no-store' });
      if (res.ok) {
        const body = (await res.json()) as { list?: ServerContract[] };
        setContracts(
          (body.list ?? []).map((c) => {
            const dept = (c.department && DEPARTMENT_LABELS[c.department]) || c.department || '-';
            return {
              id: c.idKaryawan,
              name: c.nama ?? '-',
              department: dept,
              grade: c.grade ?? '-',
              daysLeft: c.daysLeft ?? 0,
            };
          })
        );
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ ok: false, text: data?.error || 'Failed to load data' });
      }
      setLoading(false);
    })();
  }, []);

  const handleAction = async (id: string, action: 'renewal' | 'offboarding') => {
    if (processingId) return; // cegah double-processing
    setProcessingId(id);
    const res = await fetch(`/api/hr/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => null);
    setProcessingId(null);
    if (!res.ok) {
      setMessage({ ok: false, text: data?.error || 'Failed to process action' });
      return;
    }
    setMessage({
      ok: true,
      text:
        action === 'renewal'
          ? 'Renewal request sent to HR & Employee.'
          : 'Offboarding request sent to HR & Employee.',
    });
  };

  const actionsColumn: DataTableColumn<Contract> = {
    key: 'id',
    label: 'Actions',
    width: '220px',
    render: (c) => (
      <div className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          className="flex-1 whitespace-nowrap"
          disabled={processingId === String(c.id)}
          onClick={() => handleAction(String(c.id), 'offboarding')}
        >
          {processingId === String(c.id) ? 'Processing...' : 'Offboarding'}
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1 whitespace-nowrap"
          disabled={processingId === String(c.id)}
          onClick={() => handleAction(String(c.id), 'renewal')}
        >
          {processingId === String(c.id) ? 'Processing...' : 'Renewal'}
        </Button>
      </div>
    ),
  };

  if (loading) return <TableSkeleton columns={5} />;

  return (
    <>
      <ContractTrackingPage contracts={contracts} actionsColumn={actionsColumn} />

      <StatusModal state={message} onClose={() => setMessage(null)} />
    </>
  );
}