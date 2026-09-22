'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SearchPanel from '@/app/components/data-display/SearchPanel';
import SectionCard from '@/app/components/layout/SectionCard';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import { SearchTextField, SearchSelectField, SearchDateRangeCalendarField } from '@/app/components/forms/SearchFields';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { DEPARTMENT_OPTIONS, getAllGradeOptions } from '@/app/utils/orgStructure';
import StatusModal from '@/app/components/feedback/StatusModal';
import { copyTSV } from '@/lib/sheets';
import { formatDateWIB, formatDateTimeWIB } from '@/app/utils/formatDate';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface LeaveRecord {
  id: string;
  name: string;
  department: string;
  grade: string;
  type: string;
  jenis: string;
  startDate: string;
  endDate: string;
  totalDays: number | null;
  reason: string;
  note: string;
  submittedDate: string;
  status: string;
  tanggalKerjaHariLibur: string | null;
  tanggalSelesaiKerjaLibur: string | null;
  tipeCutiKompensasi: string | null;
  jumlahHariKompensasi: number | null;
}

interface RawLeave {
  idCuti: string;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null } | null;
  masterJenisCuti?: { namaJenis?: string | null } | null;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  jumlahHari?: number | null;
  keterangan?: string | null;
  catatan?: string | null;
  tanggalPengajuan?: string | null;
  idStatus?: string | null;
  tanggalKerjaHariLibur?: string | null;
  tanggalSelesaiKerjaLibur?: string | null;
  tipeCutiKompensasi?: string | null;
  jumlahHariKompensasi?: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  ST_LEAVE_PENDING: 'Pending',
  ST_LEAVE_APPROVED: 'Approved',
  ST_LEAVE_REJECTED: 'Rejected',
};

const DEPARTMENT_LABEL: Record<string, string> = {
  ops: 'Operations',
  health: 'Health and Wellbeing',
  strategy: 'Strategy and Transformation',
  education: 'Education and HR',
  digital: 'Digital and Finance',
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

interface Filters {
  name: string;
  department: string;
  grade: string;
  type: string;
  duration: string;
  from: string;
  to: string;
}

const emptyFilters: Filters = { name: '', department: '', grade: '', type: '', duration: '', from: '', to: '' };
const durationOptions = ['<= 7 Days', '>= 7 Days'];
const leaveTypeOptions = ['Paid Leave', 'Unpaid Leave', 'Special Leave', 'Compensatory Leave'];

export default function LeaveRecordPage() {
  const [rows, setRows] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState<LeaveRecord | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const { draft, applied, setField, setFieldAndApply, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);
  const gradeOptions = useMemo(() => getAllGradeOptions(), []);

  const DetailField = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200 last:border-b-0">
      <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-[15px] text-amana-neutral-500 text-right break-words">{value}</span>
    </div>
  );

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/leave/list', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRows(
          ((data as { list?: RawLeave[] }).list ?? []).map((c) => ({
            id: c.idCuti,
            name: c.karyawan?.nama ?? '-',
            department: (c.karyawan?.department && DEPARTMENT_LABEL[c.karyawan.department]) || c.karyawan?.department || '-',
            grade: c.karyawan?.masterGrade?.namaGrade ?? '-',
            type: c.masterJenisCuti?.namaJenis ?? 'Leave',
            jenis: c.masterJenisCuti?.namaJenis ?? 'cuti',
            startDate: c.tanggalMulai ? iso(new Date(c.tanggalMulai)) : '',
            endDate: c.tanggalSelesai ? iso(new Date(c.tanggalSelesai)) : '',
            totalDays: c.jumlahHari ?? null,
            reason: c.keterangan ?? '-',
            note: c.catatan ?? '',
            submittedDate: c.tanggalPengajuan ?? '',
            status: c.idStatus ?? 'ST_LEAVE_PENDING',
            tanggalKerjaHariLibur: c.tanggalKerjaHariLibur ?? null,
            tanggalSelesaiKerjaLibur: c.tanggalSelesaiKerjaLibur ?? null,
            tipeCutiKompensasi: c.tipeCutiKompensasi ?? null,
            jumlahHariKompensasi: c.jumlahHariKompensasi ?? null,
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
      if (applied.department && r.department !== applied.department) return false;
      if (applied.grade && r.grade !== applied.grade) return false;
      if (applied.type && r.type !== applied.type) return false;
      if (applied.duration && r.totalDays != null) {
        if (applied.duration === '<= 7 Days' && r.totalDays > 7) return false;
        if (applied.duration === '>= 7 Days' && r.totalDays < 7) return false;
      }
      if (f && r.startDate && new Date(r.startDate) < f) return false;
      if (t && r.startDate && new Date(r.startDate) > t) return false;
      return true;
    });
  }, [rows, applied]);

  const handleCopySheets = async () => {
    const header = ['Name', 'Grade', 'Leave Type', 'Start Date', 'End Date', 'Duration (days)', 'Status'];
    const lines = filtered.map((r) => {
      const start = r.startDate ? new Date(r.startDate + 'T00:00:00') : null;
      const end = r.endDate ? new Date(r.endDate + 'T00:00:00') : null;
      const duration =
        start && end ? Math.max(Math.round((end.getTime() - start.getTime()) / 86400000) + 1, 0) : '';
      return [r.name, r.grade, r.type, r.startDate, r.endDate, duration, STATUS_LABELS[r.status] ?? r.status];
    });
    const ok = await copyTSV([header, ...lines]);
    setStatus({
      ok,
      text: ok ? 'Copied to clipboard. Paste into Google Sheets (Ctrl+V).' : 'Failed to copy to clipboard.',
    });
  };

  const columns: DataTableColumn<LeaveRecord>[] = [
    { key: 'name', label: 'Name', width: '18%', minPx: 205 },
    { key: 'department', label: 'Practice Group', width: '17%', minPx: 195 },
    { key: 'grade', label: 'Grade', width: '11%', minPx: 125 },
    {
      key: 'startDate',
      label: 'Date',
      width: '14%',
      minPx: 160,
      sortValue: (r) => (r.startDate ? new Date(r.startDate).getTime() : 0),
      render: (r) => (
        <span className="text-[13px] leading-snug">
          {formatDateWIB(r.startDate)} - {formatDateWIB(r.endDate)}
        </span>
      ),
    },
    { key: 'totalDays', label: 'Duration', width: '10%', minPx: 115, render: (r) => (r.totalDays != null ? `${r.totalDays} Day(s)` : '-') },
    { key: 'type', label: 'Leave Type', width: '11%', minPx: 125 },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      minPx: 115,
      render: (r) => <StatusPill color={statusColor(STATUS_LABELS[r.status] ?? r.status)}>{STATUS_LABELS[r.status] ?? r.status}</StatusPill>,
    },
    {
      key: 'id',
      label: 'Details',
      width: '9%',
      minPx: 105,
      render: (r) => (
        <Button variant="outline" size="sm" className="w-full whitespace-nowrap" onClick={() => setDetailsModal(r)}>
          View
        </Button>
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={8} />;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <SearchPanel
        title="Filter Leave Record"
        subtitle="Filter employee leaves based on employee, department, grade, leave type, and duration."
        onReset={handleReset}
        onSearch={handleSearch}
      >
        <SearchTextField label="Employee Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
        <SearchSelectField label="Practice Group" value={draft.department} onChange={(v) => setField('department', v)} options={DEPARTMENT_OPTIONS} />
        <SearchSelectField label="Grade" value={draft.grade} onChange={(v) => setField('grade', v)} options={gradeOptions} />
        <SearchSelectField label="Leave Type" value={draft.type} onChange={(v) => setField('type', v)} options={leaveTypeOptions} />
        <SearchSelectField label="Duration" value={draft.duration} onChange={(v) => setField('duration', v)} options={durationOptions} />
        <SearchDateRangeCalendarField
          label="Start Date"
          fromValue={draft.from}
          toValue={draft.to}
          onFromChange={(v) => setField('from', v)}
          onToChange={(v) => setField('to', v)}
        />
      </SearchPanel>

      <SectionCard
        title="Leave Record"
        subtitle={`${filtered.length} record(s)`}
        scroll
        className="flex-1 min-h-[220px]"
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
            <Button variant="outline" size="md" disabled={filtered.length === 0} onClick={handleCopySheets}>
              Copy for Sheets
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={filtered}
          defaultSortKey="submittedDate"
          defaultSortDir="desc"
          emptyMessage="No leave records match your filters."
        />
      </SectionCard>

      {detailsModal && (
        <Modal title={`Leave Details - ${detailsModal.name || ''}`} onClose={() => setDetailsModal(null)} maxWidth="max-w-lg">
          <div className="p-5 flex flex-col">
            <DetailField label="Submitted On" value={detailsModal.submittedDate ? formatDateTimeWIB(detailsModal.submittedDate) : '-'} />
            <DetailField label="Employee" value={detailsModal.name} />
            <DetailField label="Practice Group" value={detailsModal.department} />
            <DetailField label="Grade" value={detailsModal.grade} />
            <div className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200">
              <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">Status</span>
              <StatusPill color={statusColor(STATUS_LABELS[detailsModal.status] ?? detailsModal.status)}>
                {STATUS_LABELS[detailsModal.status] ?? detailsModal.status}
              </StatusPill>
            </div>
            <DetailField label="Start Date" value={detailsModal.startDate ? formatDateWIB(detailsModal.startDate) : '-'} />
            <DetailField label="End Date" value={detailsModal.endDate ? formatDateWIB(detailsModal.endDate) : '-'} />
            {detailsModal.totalDays != null && (
              <DetailField label="Total Days" value={`${detailsModal.totalDays} day(s)`} />
            )}
            {detailsModal.tanggalKerjaHariLibur && (
              <DetailField label="Holiday Work Date" value={`${formatDateWIB(detailsModal.tanggalKerjaHariLibur)}${detailsModal.tanggalSelesaiKerjaLibur ? ` - ${formatDateWIB(detailsModal.tanggalSelesaiKerjaLibur)}` : ''}`} />
            )}
            {detailsModal.tipeCutiKompensasi && (
              <DetailField label="Day Type" value={detailsModal.tipeCutiKompensasi === 'FULL' ? 'Full Day (1 day)' : 'Half Day (0.5 day)'} />
            )}
            {detailsModal.jumlahHariKompensasi != null && (
              <DetailField label="Compensatory Days" value={`${detailsModal.jumlahHariKompensasi} day(s)`} />
            )}
            <DetailField label={detailsModal.jenis === 'sakit' ? 'Symptoms' : 'Reason'} value={detailsModal.reason ?? '-'} />
            {detailsModal.note && <DetailField label="Approver Note" value={detailsModal.note} />}
          </div>
        </Modal>
      )}

      <StatusModal state={status} onClose={() => setStatus(null)} />
    </div>
  );
}