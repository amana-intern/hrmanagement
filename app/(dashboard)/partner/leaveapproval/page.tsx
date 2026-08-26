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
import StatusModal from '@/app/components/feedback/StatusModal';
import RejectReasonModal from '@/app/components/feedback/RejectReasonModal';
import Button from '@/app/components/forms/Button';
import LeaveDetailModal, { LeaveDetailRow } from '@/app/components/LeaveDetailModal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { DEPARTMENT_OPTIONS, getAllGradeOptions } from '@/app/utils/orgStructure';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

const DEPARTMENT_LABEL: Record<string, string> = {
  ops: 'Operations',
  health: 'Health and Wellbeing',
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
  dates: string;
  status: string;
  details: null;
  action: null;
  jenis: 'cuti' | 'sakit';
  detailRow: LeaveDetailRow;
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
  tanggalPengajuan?: string | null;
  jumlahHari?: number | null;
  keterangan?: string | null;
  catatan?: string | null;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null };
  masterJenisCuti?: { namaJenis?: string | null };
}

function mapRows(rows: LeaveRaw[]): LeaveReq[] {
  return rows.map((c) => {
    const name = c.karyawan?.nama ?? '-';
    const department = (c.karyawan?.department && DEPARTMENT_LABEL[c.karyawan.department]) || c.karyawan?.department || '-';
    const grade = c.karyawan?.masterGrade?.namaGrade ?? '-';
    const type = c.masterJenisCuti?.namaJenis ?? 'Leave';
    const dates = `${new Date(c.tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(c.tanggalSelesai).toLocaleDateString('id-ID')}`;
    return {
      id: c.idCuti,
      idCuti: c.idCuti,
      name,
      department,
      grade,
      type,
      dates,
      status: c.idStatus,
      details: null,
      action: null,
      jenis: 'cuti',
      detailRow: {
        idCuti: c.idCuti,
        name,
        department,
        grade,
        type,
        dates,
        jumlahHari: c.jumlahHari,
        tanggalPengajuan: c.tanggalPengajuan,
        keterangan: c.keterangan,
        catatan: c.catatan,
        jenis: 'cuti',
      },
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
    const department = (s.karyawan?.department && DEPARTMENT_LABEL[s.karyawan.department]) || s.karyawan?.department || '-';
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
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [detailRow, setDetailRow] = useState<LeaveDetailRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
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
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    { key: 'dates', label: 'Dates' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <StatusPill color={statusColor(STATUS_MAP[r.status]?.label ?? r.status)}>
          {STATUS_MAP[r.status]?.label ?? r.status}
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
            emptyMessage="Tidak ada pengajuan."
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

      <StatusModal state={message} onClose={() => setMessage(null)} />

      <LeaveDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}