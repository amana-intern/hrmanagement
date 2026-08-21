'use client';

import { useEffect, useState } from 'react';
import PageTopBar from '../../components/layout/PageTopBar';
import SectionCard from '../../components/layout/SectionCard';
import DataTable from '../../components/data-display/DataTable';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import Button from '../../components/forms/Button';
import TextField from '../../components/forms/TextField';
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
    if (!newDate) return alert('Please select a date first');
    if (newEndDate && newEndDate < newDate) return alert('End date must be after or equal to start date');
    setSaving(true);
    setError('');
    const res = await fetch('/api/hr/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tanggal: newDate, tanggalAkhir: newEndDate || null, alasan: newReason }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return alert(data?.error || 'Failed to block date');
    setNewDate('');
    setNewEndDate('');
    setNewReason('');
    await load();
  };

  const handleDelete = async (row: BlockedDate) => {
    if (!window.confirm(`Delete blocked date ${blockLabel(row)}?`)) return;
    const res = await fetch(`/api/hr/blocked-dates/${row.id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Failed to delete');
    await load();
  };

  const columns: DataTableColumn<BlockedDate>[] = [
    {
      key: 'tanggal',
      label: 'Date',
      render: (r) => blockLabel(r),
      sortValue: (r) => (r.tanggal ? new Date(r.tanggal).getTime() : 0),
    },
    { key: 'alasan', label: 'Reason' },
    {
      key: 'id',
      label: 'Action',
      render: (r) => (
        <Button variant="danger" size="sm" className="w-full" onClick={() => handleDelete(r)}>
          Remove
        </Button>
      ),
    },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting section="Attendance" page="Blocked Dates" />

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
          <Button variant="primary" size="lg" disabled={saving || !newDate} onClick={handleAdd}>
            {saving ? 'Saving...' : '+ Block'}
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
        />
      </SectionCard>
    </div>
  );
}