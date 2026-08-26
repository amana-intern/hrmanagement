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
import StatusModal, { StatusState } from '@/app/components/feedback/StatusModal';
import RejectReasonModal from '@/app/components/feedback/RejectReasonModal';
import Button from '@/app/components/forms/Button';
import LeaveDetailModal, { LeaveDetailRow } from '@/app/components/LeaveDetailModal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { DEPARTMENT_OPTIONS, getAllGradeOptions } from '@/app/utils/orgStructure';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';
import { DEPARTMENT_LABELS, LEAVE_STATUS, LEAVE_STATUS_LABELS } from '@/lib/constants';
import { toLeaveDetailRow, type LeaveRaw } from '@/app/utils/leave';

interface LeaveReq {
  id: string;
  idCuti: string;
  name: string;
  department: string;
  grade: string;
  type: string;
  dates: string;
  status: string;
  details: null;
  action: null;
  jenis: 'cuti' | 'sakit';
  detailRow: LeaveDetailRow;
}

// Izin sakit (view-only) memakai kode status terpisah dari cuti (ST_MED_PENDING).
const STATUS_LABELS: Record<string, string> = { ...LEAVE_STATUS_LABELS, ST_MED_PENDING: 'Pending' };

const STATUS_OPTIONS = Object.values(STATUS_LABELS);

function mapRows(rows: LeaveRaw[]): LeaveReq[] {
  return rows.map((c) => {
    const detailRow = toLeaveDetailRow(c);
    return {
      id: c.idCuti,
      idCuti: c.idCuti,
      name: detailRow.name,
      department: detailRow.department,
      grade: detailRow.grade,
      type: detailRow.type,
      dates: detailRow.dates,
      status: c.idStatus ?? LEAVE_STATUS.PENDING,
      details: null,
      action: null,
      jenis: 'cuti',
      detailRow,
    };
  });
}

interface SickRaw {
  idIzinSakit: string;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  gejala?: string | null;
  buktiSakitURL?: string | null;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null };
}

function mapSickRows(rows: SickRaw[]): LeaveReq[] {
  return rows.map((s) => {
    const name = s.karyawan?.nama ?? '-';
    const department = (s.karyawan?.department && DEPARTMENT_LABELS[s.karyawan.department]) || s.karyawan?.department || '-';
    const grade = s.karyawan?.masterGrade?.namaGrade ?? '-';
    const dates = `${s.tanggalMulai ? new Date(s.tanggalMulai).toLocaleDateString('id-ID') : '-'} - ${s.tanggalSelesai ? new Date(s.tanggalSelesai).toLocaleDateString('id-ID') : '-'}`;
    return {
      id: s.idIzinSakit,
      idCuti: s.idIzinSakit,
      name,
      department,
      grade,
      type: 'Sick Leave',
      dates,
      status: 'ST_MED_PENDING',
      details: null,
      action: null,
      jenis: 'sakit',
      detailRow: {
        idCuti: s.idIzinSakit,
        name,
        department,
        grade,
        type: 'Sick Leave',
        dates,
        tanggalPengajuan: s.tanggalMulai,
        gejala: s.gejala,
        buktiSakitURL: s.buktiSakitURL,
        jenis: 'sakit',
      },
    };
  });
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
  const [message, setMessage] = useState<StatusState | null>(null);
  const [detailRow, setDetailRow] = useState<LeaveDetailRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);
  const gradeOptions = useMemo(() => getAllGradeOptions(), []);
  const typeOptions = useMemo(() => Array.from(new Set(requests.map((r) => r.type))).sort(), [requests]);

  const load = async () => {
    const res = await fetch('/api/leave/list', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const cuti = mapRows((data.list ?? []) as LeaveRaw[]);
      const sick = mapSickRows((data.sickList ?? []) as SickRaw[]);
      setRequests([...cuti, ...sick].sort((a, b) => new Date(b.dates.slice(0, 10)).getTime() - new Date(a.dates.slice(0, 10)).getTime()));
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
      if (applied.status && (STATUS_LABELS[r.status] ?? r.status) !== applied.status) return false;
      return matchSearch;
    });
  }, [requests, applied]);

  const handleAction = async (id: string, action: 'approve' | 'reject', catatan?: string) => {
    if (processingId) return; // cegah double-processing
    setProcessingId(id);
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
    setProcessingId(null);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setRejectTarget(null);
    await handleAction(id, 'reject', reason);
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
        disabled={r.status !== LEAVE_STATUS.PENDING || processingId === r.id}
        onApprove={() => handleAction(r.id, 'approve')}
        onReject={() => setRejectTarget(r.id)}
      />
    );
  };

  const columns: DataTableColumn<LeaveReq>[] = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    { key: 'dates', label: 'Dates' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <StatusPill color={statusColor(STATUS_LABELS[r.status] ?? r.status)}>
          {STATUS_LABELS[r.status] ?? r.status}
        </StatusPill>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      width: '140px',
      render: (r) => (
        <Button variant="primary" size="sm" onClick={() => setDetailRow(r.detailRow)}>
          View Details
        </Button>
      ),
    },
    { key: 'action', label: 'Action', width: '240px', render: renderAction },
  ];

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
            emptyMessage="No leave requests match your filters."
          />
        </SectionCard>
      </div>

      {rejectTarget && (
        <RejectReasonModal
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleConfirmReject}
          submitting={!!processingId}
        />
      )}

      <StatusModal state={message} onClose={() => setMessage(null)} />

      <LeaveDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}