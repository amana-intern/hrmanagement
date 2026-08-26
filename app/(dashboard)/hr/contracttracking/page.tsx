'use client';

import { useEffect, useState } from 'react';
import ContractTrackingPage from '@/app/components/data-display/ContractTrackingPage';
import type { Contract } from '@/app/components/data-display/ContractTrackingPage';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import Modal from '@/app/components/feedback/Modal';
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import Button from '@/app/components/forms/Button';
import TextField from '@/app/components/forms/TextField';
import { DEPARTMENT_LABELS } from '@/lib/constants';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  tipeKontrak: string | null;
  startDate: string | null;
  endDate: string | null;
  daysLeft: number | null;
  needAction: string | null;
  needActionBy: string | null;
}

export default function HRContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusState | null>(null);

  const [extendModal, setExtendModal] = useState<Contract | null>(null);
  const [extendStart, setExtendStart] = useState('');
  const [extendEnd, setExtendEnd] = useState('');
  const [extendSaving, setExtendSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadContracts = async () => {
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
            needAction: c.needAction,
            needActionBy: c.needActionBy,
          };
        })
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleExtend = async () => {
    if (!extendModal || !extendStart || !extendEnd) return;
    setExtendSaving(true);
    try {
      const res = await fetch('/api/hr/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idKaryawan: extendModal.id, tanggalMulai: extendStart, tanggalBerakhir: extendEnd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, text: data?.error || 'Failed to extend contract' });
        return;
      }
      setExtendModal(null);
      setExtendStart('');
      setExtendEnd('');
      await loadContracts();
      setStatus({ ok: true, text: `Contract for "${extendModal.name}" successfully extended.` });
    } catch {
      setStatus({ ok: false, text: 'A network error occurred' });
    } finally {
      setExtendSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/talent-roster/${deleteModal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, text: data?.error || 'Failed to delete employee' });
        return;
      }
      const deletedName = deleteModal.name;
      setDeleteModal(null);
      await loadContracts();
      setStatus({ ok: true, text: `Employee "${deletedName}" successfully deleted.` });
    } catch {
      setStatus({ ok: false, text: 'A network error occurred' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <TableSkeleton columns={5} />;

  return (
    <>
      <ContractTrackingPage
        contracts={contracts}
        showStartDate
        showNeedAction
        onExtend={(c) => {
          setExtendStart('');
          setExtendEnd('');
          setExtendModal(c);
        }}
        onDelete={(c) => setDeleteModal(c)}
      />

      {extendModal && (
        <Modal title={`Extend Contract - ${extendModal.name}`} onClose={() => setExtendModal(null)} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <TextField label="Start Date" type="date" value={extendStart} onChange={setExtendStart} />
            <TextField label="End Date" type="date" value={extendEnd} onChange={setExtendEnd} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="lg" onClick={() => setExtendModal(null)}>Cancel</Button>
              <Button variant="primary" size="lg" disabled={extendSaving || !extendStart || !extendEnd} onClick={handleExtend}>
                {extendSaving ? 'Processing...' : 'Extend Contract'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title={`Delete Employee - ${deleteModal.name}`} onClose={() => setDeleteModal(null)} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-amana-neutral-400">
              Are you sure you want to delete <span className="font-semibold text-amana-neutral-500">{deleteModal.name}</span>?
              Employee data along with all their records will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="lg" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="danger" size="lg" disabled={deleting} onClick={handleDelete}>
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
