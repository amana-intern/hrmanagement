'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '../../components/layout/PageTopBar';
import SearchPanel from '../../components/data-display/SearchPanel';
import SectionCard from '../../components/layout/SectionCard';
import DataTable from '../../components/data-display/DataTable';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import StatusPill from '../../components/data-display/StatusPill';
import { SearchTextField } from '../../components/forms/SearchFields';
import TextField from '../../components/forms/TextField';
import Button from '../../components/forms/Button';
import Modal from '../../components/feedback/Modal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { formatDateTimeWIB, formatDateWIB } from '@/app/utils/formatDate';
import { downloadTSV } from '@/lib/sheets';

interface LeaveRecord {
  id: string;
  name: string;
  grade: string;
  type: string;
  startDate: string;
  endDate: string;
  dates: string;
  submitted: string;
  status: string;
  reason: string;
  duration: number | null;
}

interface RawLeave {
  idCuti: string;
  karyawan?: { nama?: string | null; masterGrade?: { namaGrade?: string | null } | null };
  masterJenisCuti?: { namaJenis?: string | null } | null;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  tanggalPengajuan?: string | null;
  idStatus?: string | null;
  keterangan?: string | null;
  jumlahHari?: number | null;
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
  const [detailRow, setDetailRow] = useState<LeaveRecord | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

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
            dates: c.tanggalMulai
              ? `${formatDateWIB(c.tanggalMulai)}${c.tanggalSelesai ? ` - ${formatDateWIB(c.tanggalSelesai)}` : ''}`
              : '-',
            submitted: formatDateTimeWIB(c.tanggalPengajuan),
            status: c.idStatus ?? 'ST_LEAVE_PENDING',
            reason: c.keterangan?.trim() || '-',
            duration: c.jumlahHari ?? null,
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
    const header = ['Name', 'Grade', 'Leave Type', 'Submitted', 'Start Date', 'End Date', 'Duration (days)', 'Status'];
    const lines = filtered.map((r) => {
      const start = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
      const end = r.endDate ? new Date(r.endDate + 'T00:00:00') : null;
      const duration =
        start && end ? Math.max(Math.round((end.getTime() - start.getTime()) / 86400000) + 1, 0) : '';
      return [r.name, r.grade, r.type, r.submitted, r.startDate, r.endDate, duration, STATUS_LABELS[r.status] ?? r.status];
    });
    downloadTSV(`leave-record_${applied.from || 'all'}_${applied.to || 'all'}.tsv`, [header, ...lines]);
  };

  const columns: DataTableColumn<LeaveRecord>[] = [
    { key: 'submitted', label: 'Submitted', sortValue: (r) => (r.submitted === '-' ? 0 : 1) },
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    {
      key: 'id',
      label: 'Detail',
      render: (r) => (
        <Button variant="primary" size="sm" onClick={() => setDetailRow(r)}>
          Detail
        </Button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusPill color={statusColor(STATUS_LABELS[r.status] ?? r.status)}>{STATUS_LABELS[r.status] ?? r.status}</StatusPill>,
    },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting section="Attendance" page="Leave Record" />

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

      <SectionCard title="Leave Record" subtitle={`${filtered.length} record(s)`} scroll>
        <DataTable
          columns={columns}
          rows={filtered}
          defaultSortKey="name"
          emptyMessage="No leave records match your filters."
        />
      </SectionCard>

      <div className="flex-shrink-0 flex justify-end">
        <button
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          className="px-8 py-3 rounded-lg border border-amana-primary-500 bg-amana-neutral-100 text-amana-primary-500 font-semibold text-base hover:bg-amana-primary-500 hover:text-amana-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download TSV
        </button>
      </div>

      {detailRow && (
        <Modal title="Leave Detail" onClose={() => setDetailRow(null)} maxWidth="max-w-lg">
          <div className="px-5 py-4 flex flex-col gap-3 bg-amana-neutral-100">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Employee</p>
                <p className="text-[15px] text-amana-neutral-500">{detailRow.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Grade</p>
                <p className="text-[15px] text-amana-neutral-500">{detailRow.grade}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Leave Type</p>
                <p className="text-[15px] text-amana-neutral-500">{detailRow.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Date Range</p>
                <p className="text-[15px] text-amana-neutral-500">{detailRow.dates}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Total Days</p>
                <p className="text-[15px] text-amana-neutral-500">{detailRow.duration != null ? `${detailRow.duration} day(s)` : '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Submitted</p>
                <p className="text-[15px] text-amana-neutral-500">{detailRow.submitted}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Status</p>
                <p className="text-[15px] text-amana-neutral-500">{STATUS_LABELS[detailRow.status] ?? detailRow.status}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-amana-neutral-400 uppercase tracking-wide">Reason</p>
              <p className="text-[15px] text-amana-neutral-500">{detailRow.reason}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setDetailRow(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}