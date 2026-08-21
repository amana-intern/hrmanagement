'use client';

import { useEffect, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import TextField from '@/app/components/forms/TextField';
import ConfirmModal from '@/app/components/feedback/ConfirmModal';
import StatusModal from '@/app/components/feedback/StatusModal';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface BlockedDate {
  id: string;
  tanggal: string | null;
  tanggalAkhir: string | null;
  alasan: string | null;
}

const fmt = (v: string | null) => (v ? new Date(v).toLocaleDateString('id-ID', { timeZone: 'UTC' }) : '');

export default function BlockedDatesPage() {
  const [rows, setRows] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDate, setNewDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [rowToDelete, setRowToDelete] = useState<BlockedDate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const res = await fetch('/api/hr/blocked-dates', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { list?: Array<{ idBlokir: string; tanggal: string | null; tanggalAkhir: string | null; alasan: string | null }> };
      setRows(
        (data.list ?? []).map((item) => ({
          id: item.idBlokir,
          tanggal: item.tanggal,
          tanggalAkhir: item.tanggalAkhir,
          alasan: item.alasan,
        }))
      );
      setError('');
    } else {
      setError('Gagal memuat data');
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  const blockLabel = (row: BlockedDate) =>
    row.tanggalAkhir ? `${fmt(row.tanggal)} s/d ${fmt(row.tanggalAkhir)}` : fmt(row.tanggal);

  const handleAdd = async () => {
    if (!newDate) {
      setStatus({ ok: false, text: 'Please select a date first' });
      return;
    }
    if (newEndDate && newEndDate < newDate) {
      setStatus({ ok: false, text: 'End date must be on or after the start date' });
      return;
    }
    setSaving(true);
    setError('');
    const res = await fetch('/api/hr/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tanggal: newDate, tanggalAkhir: newEndDate || null, alasan: newReason }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setStatus({ ok: false, text: data?.error || 'Failed to block date' });
      return;
    }
    setNewDate('');
    setNewEndDate('');
    setNewReason('');
    await load();
  };

  const handleDelete = async (row: BlockedDate) => {
    setDeleting(true);
    const res = await fetch(`/api/hr/blocked-dates/${row.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      setStatus({ ok: false, text: 'Failed to delete' });
      return;
    }
    setRowToDelete(null);
    await load();
  };

  const columns: DataTableColumn<BlockedDate>[] = [
    {
      key: 'tanggal',
      label: 'Date',
      sortValue: (r) => (r.tanggal ? new Date(r.tanggal).getTime() : 0),
    },
    { key: 'alasan', label: 'Reason' },
    {
      key: 'id',
      label: 'Action',
      render: (r) => (
        <Button variant="danger" size="sm" className="w-full" onClick={() => setRowToDelete(r)}>
          Remove
        </Button>
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={3} />;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <SectionCard
        title="Add Blocked Date"
        subtitle="Blocked dates cannot be used for leave requests (all leave types)."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          <TextField label="Start Date" type="date" value={newDate} onChange={setNewDate} />
          <TextField label="End Date (optional)" type="date" value={newEndDate} onChange={setNewEndDate} />
          <TextField label="Reason (optional)" value={newReason} onChange={setNewReason} placeholder="e.g., National holiday" />
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="primary" size="md" disabled={saving || !newDate} onClick={handleAdd}>
            {saving ? 'Saving...' : 'Block'}
          </Button>
        </div>
      </SectionCard>

      {error && <p className="text-[14px] font-medium text-amana-danger-500">{error}</p>}

      <SectionCard title="Blocked Dates" subtitle={`${rows.length} blocked date range(s)`} scroll>
        <DataTable
          columns={columns}
          rows={rows}
          defaultSortKey="tanggal"
          emptyMessage="Belum ada tanggal diblokir."
          compact
        />
      </SectionCard>

      {rowToDelete && (
        <ConfirmModal
          title="Remove Blocked Date"
          message={<>Hapus blokir <span className="font-semibold">{blockLabel(rowToDelete)}</span>?</>}
          confirmLabel="Remove"
          loadingLabel="Removing..."
          loading={deleting}
          onConfirm={() => handleDelete(rowToDelete)}
          onCancel={() => setRowToDelete(null)}
        />
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}