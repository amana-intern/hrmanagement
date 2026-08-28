'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import SearchPanel from '@/app/components/data-display/SearchPanel';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import ApprovalActions from '@/app/components/data-display/ApprovalActions';
import { SearchTextField, SearchSelectField } from '@/app/components/forms/SearchFields';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import StatusModal from '@/app/components/feedback/StatusModal';
import RejectReasonModal from '@/app/components/feedback/RejectReasonModal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { DEPARTMENT_OPTIONS, getAllGradeOptions } from '@/app/utils/orgStructure';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import { formatDateWIB, formatDateTimeWIB } from '@/app/utils/formatDate';

const DEPARTMENT_LABEL: Record<string, string> = {
  ops: 'Operations',
  health: 'Health and Wellbeing',
  strategy: 'Strategy and Transformation',
  education: 'Education and HR',
  digital: 'Digital and Finance',
};

interface LeaveReq {
  id: string;
  idCuti: string;
  name: string;
  department: string;
  grade: string;
  type: string;
  startDate: string | null; // ISO
  endDate: string | null; // ISO
  totalDays: number | null;
  reason: string | null;
  submittedAt: string | null;
  approverNote: string | null;
  documentURL: string | null; // sick leave only
  details: null;
  status: string;
  action: null;
  jenis: 'cuti' | 'sakit';
}

const STATUS_MAP: Record<string, { label: string }> = {
  ST_LEAVE_PENDING: { label: 'Pending' },
  ST_LEAVE_APPROVED: { label: 'Approved' },
  ST_LEAVE_REJECTED: { label: 'Rejected' },
  ST_MED_PENDING: { label: 'Pending' },
};

const STATUS_OPTIONS = Object.values(STATUS_MAP).map((v) => v.label);

interface LeaveRaw {
  idCuti: string;
  idStatus: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari?: number | null;
  keterangan?: string | null;
  catatan?: string | null;
  tanggalPengajuan?: string | null;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null };
  masterJenisCuti?: { namaJenis?: string | null };
}

function mapRows(rows: LeaveRaw[]): LeaveReq[] {
  return rows.map((c) => ({
    id: c.idCuti,
    idCuti: c.idCuti,
    name: c.karyawan?.nama ?? '-',
    department: (c.karyawan?.department && DEPARTMENT_LABEL[c.karyawan.department]) || c.karyawan?.department || '-',
    grade: c.karyawan?.masterGrade?.namaGrade ?? '-',
    type: c.masterJenisCuti?.namaJenis ?? 'Leave',
    startDate: c.tanggalMulai,
    endDate: c.tanggalSelesai,
    totalDays: c.jumlahHari ?? null,
    reason: c.keterangan ?? null,
    submittedAt: c.tanggalPengajuan ?? null,
    approverNote: c.catatan ?? null,
    documentURL: null,
    details: null,
    status: c.idStatus,
    action: null,
    jenis: 'cuti',
  }));
}

interface SickRaw {
  idIzinSakit: string;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  gejala?: string | null;
  buktiSakitURL?: string | null;
  createdAt?: string | null;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null };
}

function mapSickRows(rows: SickRaw[]): LeaveReq[] {
  return rows.map((s) => ({
    id: s.idIzinSakit,
    idCuti: s.idIzinSakit,
    name: s.karyawan?.nama ?? '-',
    department: (s.karyawan?.department && DEPARTMENT_LABEL[s.karyawan.department]) || s.karyawan?.department || '-',
    grade: s.karyawan?.masterGrade?.namaGrade ?? '-',
    type: 'Sick Leave',
    startDate: s.tanggalMulai ?? null,
    endDate: s.tanggalSelesai ?? null,
    totalDays:
      s.tanggalMulai && s.tanggalSelesai
        ? Math.max(Math.round((new Date(s.tanggalSelesai).getTime() - new Date(s.tanggalMulai).getTime()) / 86400000) + 1, 0)
        : null,
    reason: s.gejala ?? null,
    submittedAt: s.createdAt ?? null,
    approverNote: null,
    documentURL: s.buktiSakitURL ?? null,
    details: null,
    status: 'ST_MED_PENDING',
    action: null,
    jenis: 'sakit',
  }));
}

interface Filters {
  search: string;
  department: string;
  grade: string;
  type: string;
  status: string;
}

const emptyFilters: Filters = { search: '', department: '', grade: '', type: '', status: '' };

export default function PartnerLeaveApprovalPage() {
  const [requests, setRequests] = useState<LeaveReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [detailRow, setDetailRow] = useState<LeaveReq | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);
  const gradeOptions = useMemo(() => getAllGradeOptions(), []);
  const typeOptions = useMemo(() => Array.from(new Set(requests.map((r) => r.type))).sort(), [requests]);

  const load = async () => {
    const res = await fetch('/api/leave/list', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const cuti = mapRows((data.list ?? []) as LeaveRaw[]);
      const sick = mapSickRows((data.sickList ?? []) as SickRaw[]);
      setRequests([...cuti, ...sick].sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime()));
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data?.error ?? 'Failed to load data' });
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.idCuti.toLowerCase().includes(q);
      if (applied.department && r.department !== applied.department) return false;
      if (applied.grade && r.grade !== applied.grade) return false;
      if (applied.type && r.type !== applied.type) return false;
      if (applied.status && (STATUS_MAP[r.status]?.label ?? r.status) !== applied.status) return false;
      return matchSearch;
    });
  }, [requests, applied]);

  const handleAction = async (id: string, action: 'approve' | 'reject', catatan?: string) => {
    const res = await fetch(`/api/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, catatan: catatan?.trim() }),
    });
    if (res.ok) {
      await load();
      setMessage({ ok: true, text: action === 'approve' ? 'Leave request successfully approved.' : 'Leave request successfully rejected.' });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data?.error ?? 'Failed to process request' });
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    setRejecting(true);
    await handleAction(rejectTarget, 'reject', reason);
    setRejecting(false);
    setRejectTarget(null);
  };

  const renderAction = (r: LeaveReq) => {
    if (r.jenis === 'sakit') {
      return (
        <span className="text-[14px] text-amana-neutral-400 italic whitespace-nowrap">
          View Only
        </span>
      );
    }
    return (
      <ApprovalActions
        disabled={r.status !== 'ST_LEAVE_PENDING'}
        onApprove={() => handleAction(r.id, 'approve')}
        onReject={() => setRejectTarget(r.id)}
      />
    );
  };

  const columns: DataTableColumn<LeaveReq>[] = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'department', label: 'Department' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    {
      key: 'details',
      label: 'Details',
      width: '140px',
      render: (r) => (
        <Button
          variant="primary"
          size="sm"
          className="w-full whitespace-nowrap"
          onClick={() => setDetailRow(r)}
        >
          View
        </Button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <StatusPill color={statusColor(STATUS_MAP[r.status]?.label ?? r.status)}>
          {STATUS_MAP[r.status]?.label ?? r.status}
        </StatusPill>
      ),
    },
    { key: 'action', label: 'Action', width: '240px', render: renderAction },
  ];

  const DetailField = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200 last:border-b-0">
      <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-[15px] text-amana-neutral-500 text-right break-words">{value}</span>
    </div>
  );

  if (loading) return <TableSkeleton columns={6} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

        <SearchPanel
          title="Search Leave Approval"
          subtitle="Filter leave requests by employee name, department, grade, leave type, or status."
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <SearchTextField
            label="Name / ID"
            value={draft.search}
            onChange={(v) => setField('search', v)}
            placeholder="Search by name or ID..."
          />
          <SearchSelectField label="Department" value={draft.department} onChange={(v) => setField('department', v)} options={DEPARTMENT_OPTIONS} />
          <SearchSelectField label="Grade" value={draft.grade} onChange={(v) => setField('grade', v)} options={gradeOptions} />
          <SearchSelectField label="Leave Type" value={draft.type} onChange={(v) => setField('type', v)} options={typeOptions} />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={STATUS_OPTIONS} />
        </SearchPanel>

        <SectionCard title="Leave Approval List" subtitle={`${filtered.length} request(s)`} scroll>
          <DataTable
            columns={columns}
            rows={filtered}
            defaultSortKey="name"
            emptyMessage="No requests found."
          />
        </SectionCard>
      </div>

      {rejectTarget && (
        <RejectReasonModal
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleConfirmReject}
          submitting={rejecting}
        />
      )}

      {detailRow && (
        <Modal
          title={`Leave Details - ${detailRow.name || ''}`}
          onClose={() => setDetailRow(null)}
          maxWidth="max-w-lg"
        >
          <div className="p-5 flex flex-col">
            <DetailField label="Submitted On" value={formatDateTimeWIB(detailRow.submittedAt)} />
            <DetailField label="Employee" value={detailRow.name} />
            <DetailField label="Department" value={detailRow.department} />
            <DetailField label="Grade" value={detailRow.grade} />
            <div className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200">
              <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">Status</span>
              <StatusPill color={statusColor(STATUS_MAP[detailRow.status]?.label ?? detailRow.status)}>
                {STATUS_MAP[detailRow.status]?.label ?? detailRow.status}
              </StatusPill>
            </div>
            <DetailField label="Start Date" value={formatDateWIB(detailRow.startDate)} />
            <DetailField label="End Date" value={formatDateWIB(detailRow.endDate)} />
            {detailRow.totalDays != null && (
              <DetailField label="Total Days" value={`${detailRow.totalDays} day(s)`} />
            )}
            <DetailField label={detailRow.jenis === 'sakit' ? 'Symptoms' : 'Reason'} value={detailRow.reason ?? '-'} />
            {detailRow.approverNote && <DetailField label="Approver Note" value={detailRow.approverNote} />}
            {detailRow.documentURL && (
              <DetailField
                label="Medical Document"
                value={
                  <a
                    href={detailRow.documentURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amana-primary-500 underline"
                  >
                    View document
                  </a>
                }
              />
            )}
          </div>
        </Modal>
      )}

      <StatusModal state={message} onClose={() => setMessage(null)} />
    </>
  );
}
