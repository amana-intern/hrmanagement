'use client';

import { useEffect, useState } from 'react';
import ContractTrackingPage from '@/app/components/data-display/ContractTrackingPage';
import type { Contract } from '@/app/components/data-display/ContractTrackingPage';
import { needActionBadge } from '@/app/components/data-display/ContractTrackingPage';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import ConfirmModal from '@/app/components/feedback/ConfirmModal';
import StatusModal from '@/app/components/feedback/StatusModal';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  startDate: string | null;
  endDate: string | null;
  daysLeft: number | null;
  needAction?: string | null;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  health: 'Health & Wellbeing',
  strategy: 'Strategy and Transformation',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

export default function PartnerContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Contract | null>(null);
  const [confirmAction, setConfirmAction] = useState<'renewal' | 'offboarding' | null>(null);

  const load = async () => {
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
            startDate: c.startDate ? c.startDate.slice(0, 10) : '',
            endDate: c.endDate ? c.endDate.slice(0, 10) : '',
            daysLeft: c.daysLeft ?? 0,
            needAction: c.needAction ?? null,
          };
        })
      );
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || 'Failed to load data' });
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await load();
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
    await load(); // tombol langsung berganti jadi teks status
  };

  const actionsColumn: DataTableColumn<Contract> = {
    key: 'id',
    label: 'Decision',
    width: '220px',
    render: (c) => {
      // Decision sudah diinput -> tampilkan teks status (bukan badge/tombol),
      // bergaya sama seperti "View Only" pada kolom Action di Leave Approval.
      const badge = needActionBadge(c.needAction);
      if (badge) {
        return (
          <span className="text-[14px] text-amana-neutral-400 italic whitespace-nowrap">
            {badge.label}
          </span>
        );
      }
      return (
        <div className="flex gap-2">
          <Button
            variant="danger-outline"
            size="sm"
            className="flex-1 whitespace-nowrap"
            disabled={processingId === String(c.id)}
            onClick={() => { setConfirmTarget(c); setConfirmAction('offboarding'); }}
          >
            Offboarding
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 whitespace-nowrap"
            disabled={processingId === String(c.id)}
            onClick={() => { setConfirmTarget(c); setConfirmAction('renewal'); }}
          >
            Renewal
          </Button>
        </div>
      );
    },
  };

  if (loading) return <TableSkeleton columns={5} />;

  return (
    <>
      <ContractTrackingPage contracts={contracts} actionsColumn={actionsColumn} />

      {confirmTarget && confirmAction && (
        <ConfirmModal
          title={confirmAction === 'offboarding' ? 'Confirm Offboarding' : 'Confirm Renewal'}
          tone={confirmAction === 'offboarding' ? 'danger' : 'primary'}
          message={
            confirmAction === 'offboarding'
              ? <>Are you sure you want to initiate offboarding for <span className="font-semibold">{confirmTarget.name}</span>? This will send a request to HR and the employee.</>
              : <>Are you sure you want to request a contract renewal for <span className="font-semibold">{confirmTarget.name}</span>? This will send a request to HR and the employee.</>
          }
          confirmLabel={confirmAction === 'offboarding' ? 'Offboarding' : 'Renewal'}
          loadingLabel="Processing..."
          loading={processingId === String(confirmTarget.id)}
          onConfirm={() => { handleAction(String(confirmTarget.id), confirmAction); setConfirmTarget(null); setConfirmAction(null); }}
          onCancel={() => { setConfirmTarget(null); setConfirmAction(null); }}
        />
      )}

      <StatusModal state={message} onClose={() => setMessage(null)} />
    </>
  );
}
