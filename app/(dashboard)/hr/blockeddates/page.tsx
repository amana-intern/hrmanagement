'use client';

import { useEffect, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import Button from '@/app/components/forms/Button';
import TextField from '@/app/components/forms/TextField';
import { SearchDateRangeCalendarField } from '@/app/components/forms/SearchFields';
import ConfirmModal from '@/app/components/feedback/ConfirmModal';
import Spinner from '@/app/components/feedback/Spinner';
import StatusModal from '@/app/components/feedback/StatusModal';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import { formatDateWIB } from '@/app/utils/formatDate';

interface BlockedDate {
  id: string;
  tanggal: string | null;
  tanggalAkhir: string | null;
  alasan: string | null;
}

const fmt = (v: string | null) => (v ? formatDateWIB(v) : '');

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowToBlock, setRowToBlock] = useState<{ tanggal: string; tanggalAkhir: string | null; alasan: string } | null>(null);

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
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  const blockLabel = (row: BlockedDate) =>
    row.tanggalAkhir ? `${fmt(row.tanggal)} - ${fmt(row.tanggalAkhir)}` : fmt(row.tanggal);

  const handleAdd = async () => {
    if (!newDate) {
      setStatus({ ok: false, text: 'Please select a date first' });
      return;
    }
    if (newEndDate && newEndDate < newDate) {
      setStatus({ ok: false, text: 'End date must be on or after the start date' });
      return;
    }
    setRowToBlock({ tanggal: newDate, tanggalAkhir: newEndDate || null, alasan: newReason });
  };

  const confirmBlock = async () => {
    if (!rowToBlock) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/hr/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tanggal: rowToBlock.tanggal, tanggalAkhir: rowToBlock.tanggalAkhir, alasan: rowToBlock.alasan }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setSaving(false);
      setStatus({ ok: false, text: data?.error || 'Failed to block date' });
      return;
    }
    await load();
    setSaving(false);
    setRowToBlock(null);
    setNewDate('');
    setNewEndDate('');
    setNewReason('');
  };

  const handleDelete = async (row: BlockedDate) => {
    setRowToDelete(null);
    setDeletingId(row.id);
    const res = await fetch(`/api/hr/blocked-dates/${row.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setStatus({ ok: false, text: 'Failed to delete' });
    } else {
      await load();
    }
    setDeletingId(null);
  };

  const columns: DataTableColumn<BlockedDate>[] = [
    {
      key: 'tanggal',
      label: 'Date',
      width: '34%',
      minPx: 300,
      sortValue: (r) => (r.tanggal ? new Date(r.tanggal).getTime() : 0),
      render: (r) => (
        <span className="text-[13px] leading-snug whitespace-normal break-words">
          {fmt(r.tanggal)}
          {r.tanggalAkhir ? ` - ${fmt(r.tanggalAkhir)}` : ''}
        </span>
      ),
    },
    {
      key: 'alasan',
      label: 'Reason',
      width: '46%',
      minPx: 400,
      render: (r) => (
        <span className="block w-full text-[13px] leading-snug whitespace-normal break-words">
          {r.alasan ?? '-'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      width: '20%',
      minPx: 170,
      render: (r) =>
        deletingId === r.id ? (
          <div className="flex items-center justify-center h-9">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <SearchDateRangeCalendarField
            label="Blocked Period"
            fromValue={newDate}
            toValue={newEndDate}
            onFromChange={setNewDate}
            onToChange={setNewEndDate}
          />
          <TextField label="Reason (optional)" value={newReason} onChange={setNewReason} placeholder="e.g., National holiday" />
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="primary" size="md" disabled={!newDate} onClick={handleAdd}>
            Block
          </Button>
        </div>
      </SectionCard>

      {error && <p className="text-[14px] font-medium text-amana-danger-500">{error}</p>}

      <SectionCard title="Blocked Dates" subtitle={`${rows.length} blocked date range(s)`} scroll>
        <DataTable
          columns={columns}
          rows={rows}
          defaultSortKey="tanggal"
          emptyMessage="No blocked dates yet."
          compact
        />
      </SectionCard>

      {rowToDelete && (
        <ConfirmModal
          title="Remove Blocked Date"
          message={
            <>
              Remove blocked dates from <span className="font-semibold">{blockLabel(rowToDelete)}</span>?
              {rowToDelete.alasan && (
                <span className="block mt-1 text-[14px] text-amana-neutral-400">Reason: {rowToDelete.alasan}</span>
              )}
            </>
          }
          confirmLabel="Remove"
          onConfirm={() => handleDelete(rowToDelete)}
          onCancel={() => setRowToDelete(null)}
        />
      )}

      {rowToBlock && (
        <ConfirmModal
          title="Confirm Block Date"
          message={
            <>
              Block dates from <span className="font-semibold">{fmt(rowToBlock.tanggal)}</span>
              {rowToBlock.tanggalAkhir ? <> to <span className="font-semibold">{fmt(rowToBlock.tanggalAkhir)}</span></> : ''}?
              {rowToBlock.alasan && (
                <span className="block mt-1 text-[14px] text-amana-neutral-400">Reason: {rowToBlock.alasan}</span>
              )}
            </>
          }
          confirmLabel="Block"
          loadingLabel="Blocking..."
          loading={saving}
          onConfirm={confirmBlock}
          onCancel={() => setRowToBlock(null)}
        />
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}