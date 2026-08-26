'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SearchPanel from '@/app/components/data-display/SearchPanel';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import { SearchTextField } from '@/app/components/forms/SearchFields';
import TextField from '@/app/components/forms/TextField';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { downloadTSV } from '@/lib/sheets';
import { formatDateWIB } from '@/app/utils/formatDate';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface LeaveRecord {
  id: string;
  name: string;
  grade: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number | null;
  reason: string;
  note: string;
  submittedDate: string;
  status: string;
}

interface RawLeave {
  idCuti: string;
  karyawan?: { nama?: string | null; masterGrade?: { namaGrade?: string | null } | null };
  masterJenisCuti?: { namaJenis?: string | null } | null;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  jumlahHari?: number | null;
  keterangan?: string | null;
  catatan?: string | null;
  tanggalPengajuan?: string | null;
  idStatus?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  ST_LEAVE_PENDING: 'Pending',
  ST_LEAVE_APPROVED: 'Approved',
  ST_LEAVE_REJECTED: 'Rejected',
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

interface Filters {
  name: string;
  type: string;
  status: string;
  from: string;
  to: string;
}

const emptyFilters: Filters = { name: '', type: '', status: '', from: '', to: '' };

export default function LeaveRecordPage() {
  const [rows, setRows] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState<LeaveRecord | null>(null);
  const { draft, applied, setField, setFieldAndApply, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/leave/list', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRows(
          ((data as { list?: RawLeave[] }).list ?? []).map((c) => ({
            id: c.idCuti,
            name: c.karyawan?.nama ?? '-',
            grade: c.karyawan?.masterGrade?.namaGrade ?? '-',
            type: c.masterJenisCuti?.namaJenis ?? 'Leave',
            startDate: c.tanggalMulai ? iso(new Date(c.tanggalMulai)) : '',
            endDate: c.tanggalSelesai ? iso(new Date(c.tanggalSelesai)) : '',
            totalDays: c.jumlahHari ?? null,
            reason: c.keterangan ?? '-',
            note: c.catatan ?? '',
            submittedDate: c.tanggalPengajuan ? iso(new Date(c.tanggalPengajuan)) : '',
            status: c.idStatus ?? 'ST_LEAVE_PENDING',
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const f = applied.from ? new Date(applied.from + 'T00:00:00') : null;
    const t = applied.to ? new Date(applied.to + 'T23:59:59') : null;
    return rows.filter((r) => {
      if (applied.name && !r.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.type && r.type !== applied.type) return false;
      if (applied.status && STATUS_LABELS[r.status] !== applied.status) return false;
      if (f && r.startDate && new Date(r.startDate) < f) return false;
      if (t && r.startDate && new Date(r.startDate) > t) return false;
      return true;
    });
  }, [rows, applied]);

  const handleExportCsv = () => {
    const header = ['Name', 'Grade', 'Leave Type', 'Start Date', 'End Date', 'Duration (days)', 'Status'];
    const lines = filtered.map((r) => {
      const start = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
      const end = r.endDate ? new Date(r.endDate + 'T00:00:00') : null;
      const duration =
        start && end ? Math.max(Math.round((end.getTime() - start.getTime()) / 86400000) + 1, 0) : '';
      return [r.name, r.grade, r.type, r.startDate, r.endDate, duration, STATUS_LABELS[r.status] ?? r.status];
    });
    downloadTSV(`leave-record_${applied.from || 'all'}_${applied.to || 'all'}.tsv`, [header, ...lines]);
  };

  const columns: DataTableColumn<LeaveRecord>[] = [
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusPill color={statusColor(STATUS_LABELS[r.status] ?? r.status)}>{STATUS_LABELS[r.status] ?? r.status}</StatusPill>,
    },
    {
      key: 'id',
      label: 'Details',
      render: (r) => (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => setDetailsModal(r)}>
          View
        </Button>
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={5} />;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <SearchPanel
        title="Filter Leave Record"
        subtitle="Filter employee leaves based on employee, leave type, status, and date range."
        onReset={handleReset}
        onSearch={handleSearch}
      >
        <SearchTextField label="Employee Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
        <SearchTextField label="Leave Type" value={draft.type} onChange={(v) => setField('type', v)} placeholder="e.g. Paid Leave" />
        <SearchTextField label="Status" value={draft.status} onChange={(v) => setField('status', v)} placeholder="Pending / Approved / Rejected" />
        <TextField label="From" type="date" value={draft.from} onChange={(v) => setField('from', v)} />
        <TextField label="To" type="date" value={draft.to} onChange={(v) => setField('to', v)} />
      </SearchPanel>

      <SectionCard
        title="Leave Record"
        subtitle={`${filtered.length} record(s)`}
        scroll
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={draft.from}
              onChange={(e) => setFieldAndApply('from', e.target.value)}
              className="px-2 py-1.5 border border-amana-neutral-300 rounded-lg text-[14px] outline-none focus:border-amana-primary-500 bg-amana-neutral-100"
            />
            <span className="text-amana-neutral-400 text-[14px]">to</span>
            <input
              type="date"
              value={draft.to}
              onChange={(e) => setFieldAndApply('to', e.target.value)}
              className="px-2 py-1.5 border border-amana-neutral-300 rounded-lg text-[14px] outline-none focus:border-amana-primary-500 bg-amana-neutral-100"
            />
            <Button variant="outline" size="md" disabled={filtered.length === 0} onClick={handleExportCsv}>
              Export Records
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={filtered}
          defaultSortKey="name"
          emptyMessage="No leave records match your filters."
        />
      </SectionCard>

      {detailsModal && (
        <Modal title="Leave Details" onClose={() => setDetailsModal(null)} maxWidth="max-w-lg">
          <div className="p-5 flex flex-col">
            {[
              ['Employee', detailsModal.name],
              ['Grade', detailsModal.grade],
              ['Leave Type', detailsModal.type],
              ['Reason', detailsModal.reason],
              ['Start Date', detailsModal.startDate ? formatDateWIB(detailsModal.startDate) : '-'],
              ['End Date', detailsModal.endDate ? formatDateWIB(detailsModal.endDate) : '-'],
              [
                'Total Days',
                detailsModal.totalDays != null
                  ? `${detailsModal.totalDays} day(s)`
                  : detailsModal.startDate && detailsModal.endDate
                    ? `${Math.max(Math.round((new Date(detailsModal.endDate).getTime() - new Date(detailsModal.startDate).getTime()) / 86400000) + 1, 0)} day(s)`
                    : '-',
              ],
              ['Submitted On', detailsModal.submittedDate ? formatDateWIB(detailsModal.submittedDate) : '-'],
              ['Status', STATUS_LABELS[detailsModal.status] ?? detailsModal.status],
              ...(detailsModal.note ? [['Approver Note', detailsModal.note]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200 last:border-b-0">
                <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">{label}</span>
                <span className="text-[15px] text-amana-neutral-500 text-right">{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}