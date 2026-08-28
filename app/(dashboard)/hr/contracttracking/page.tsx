'use client';

import { useEffect, useState } from 'react';
import ContractTrackingPage from '@/app/components/data-display/ContractTrackingPage';
import type { Contract } from '@/app/components/data-display/ContractTrackingPage';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import StatusModal from '@/app/components/feedback/StatusModal';
import TextField from '@/app/components/forms/TextField';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  tipeKontrak: string | null;
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

export default function HRContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  // Modal Extend Contract
  const [extendTarget, setExtendTarget] = useState<Contract | null>(null);
  const [extendStart, setExtendStart] = useState('');
  const [extendEnd, setExtendEnd] = useState('');
  const [extending, setExtending] = useState(false);

  // Modal Delete Talent
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);

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
            daysLeft: c.daysLeft ?? 0,
            startDate: c.startDate ? c.startDate.slice(0, 10) : '',
            needAction: c.needAction ?? null,
          };
        })
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const openExtend = (c: Contract) => {
    setExtendStart('');
    setExtendEnd('');
    setExtendTarget(c);
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    if (!extendStart || !extendEnd) {
      setStatus({ ok: false, text: 'Contract start & end date are required' });
      return;
    }
    setExtending(true);
    try {
      const res = await fetch('/api/hr/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idKaryawan: String(extendTarget.id),
          tanggalMulai: extendStart,
          tanggalBerakhir: extendEnd,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ ok: false, text: data?.error || 'Failed to extend contract' });
        return;
      }
      setExtendTarget(null);
      await load();
      setStatus({
        ok: true,
        text: `Contract for "${extendTarget.name}" successfully extended. Leave carry-over recalculated automatically.`,
      });
    } catch {
      setStatus({ ok: false, text: 'A network error occurred' });
    } finally {
      setExtending(false);
    }
  };

  const handleDeleteTalent = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/talent-roster/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ ok: false, text: data?.error || 'Failed to delete employee' });
        return;
      }
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await load();
      setStatus({ ok: true, text: `Employee "${deletedName}" successfully deleted.` });
    } catch {
      setStatus({ ok: false, text: 'A network error occurred' });
    } finally {
      setDeleting(false);
    }
  };

  const actionColumn: DataTableColumn<Contract> = {
    key: 'id',
    label: 'Action',
    width: '200px',
    render: (c) =>
      c.needAction === 'RENEWAL' ? (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => openExtend(c)}>
          Extend Contract
        </Button>
      ) : (
        <Button variant="danger" size="sm" className="w-full whitespace-nowrap" onClick={() => setDeleteTarget(c)}>
          Delete Talent
        </Button>
      ),
  };

  if (loading) return <TableSkeleton columns={5} />;

  return (
    <>
      <ContractTrackingPage contracts={contracts} showStartDate needActionConfig={{ actionColumn }} />

      {extendTarget && (
        <Modal title="Add / Extend Contract" onClose={() => setExtendTarget(null)} maxWidth="max-w-lg">
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[16px] font-semibold text-amana-neutral-500">Employee</span>
              <span className="text-[15px] text-amana-neutral-400">
                {extendTarget.name} · {extendTarget.department} · {extendTarget.grade}
              </span>
            </div>
            <TextField label="Contract Start" type="date" value={extendStart} onChange={setExtendStart} />
            <TextField label="Contract End" type="date" value={extendEnd} onChange={setExtendEnd} />
            <p className="text-[13px] text-amana-neutral-400">
              Leave carry-over is recalculated automatically using the latest n/2 rule.
            </p>
          </div>
          <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-4 border-t border-amana-neutral-200">
            <Button variant="outline" size="lg" onClick={() => setExtendTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" disabled={extending} onClick={handleExtend}>
              {extending ? 'Saving...' : 'Extend Contract'}
            </Button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title={`Delete Employee - ${deleteTarget.name || ''}`} onClose={() => setDeleteTarget(null)} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-amana-neutral-400">
              Are you sure you want to delete <span className="font-semibold text-amana-neutral-500">{deleteTarget.name}</span>?
              Employee data along with all their records will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="lg" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" size="lg" disabled={deleting} onClick={handleDeleteTalent}>
                {deleting ? 'Processing...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </>
  );
}
