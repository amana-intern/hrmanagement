'use client';

import { useEffect, useState } from 'react';
import ContractTrackingPage from '../../components/data-display/ContractTrackingPage';
import type { Contract } from '../../components/data-display/ContractTrackingPage';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import Button from '../../components/forms/Button';
import Modal from '../../components/feedback/Modal';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  daysLeft: number | null;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  health: 'Health & Wellbeing',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

export default function PartnerContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

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
          ? 'Renewal request has been sent to HR & the employee.'
          : 'Offboarding request has been sent to HR & the employee.',
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

  if (loading) {
    return <div className="w-full flex items-center justify-center py-24">Loading...</div>;
  }

  return (
    <>
      <ContractTrackingPage contracts={contracts} actionsColumn={actionsColumn} section="Employee Record" />

      {message && (
        <Modal title={message.ok ? 'Success' : 'Failed'} onClose={() => setMessage(null)} maxWidth="max-w-md">
          <div className="px-5 py-4 flex flex-col gap-3 bg-amana-neutral-100">
            <p className="text-[15px] text-amana-neutral-500">{message.text}</p>
            <Button variant="primary" onClick={() => setMessage(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}