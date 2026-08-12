'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '../../components/layout/PageTopBar';
import SectionCard from '../../components/layout/SectionCard';
import SearchPanel from '../../components/data-display/SearchPanel';
import DataTable from '../../components/data-display/DataTable';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import StatusPill from '../../components/data-display/StatusPill';
import ApprovalActions from '../../components/data-display/ApprovalActions';
import { SearchTextField, SearchSelectField } from '../../components/forms/SearchFields';
import Button from '../../components/forms/Button';
import Modal from '../../components/feedback/Modal';
import { statusColor } from '@/app/utils/statusColor';
import { useFilters } from '@/app/utils/useFilters';
import { DEPARTMENT_OPTIONS, getAllGradeOptions } from '@/app/utils/orgStructure';

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
    dates: `${new Date(c.tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(c.tanggalSelesai).toLocaleDateString('id-ID')}`,
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
    dates: `${s.tanggalMulai ? new Date(s.tanggalMulai).toLocaleDateString('id-ID') : '-'} - ${s.tanggalSelesai ? new Date(s.tanggalSelesai).toLocaleDateString('id-ID') : '-'}`,
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
      setMessage({ ok: false, text: data?.error ?? 'Gagal memuat data' });
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

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    let catatan: string | null = null;
    if (action === 'reject') {
      catatan = window.prompt('Alasan penolakan (wajib diisi):');
      if (catatan === null) return;
      if (!catatan.trim()) {
        setMessage({ ok: false, text: 'Alasan penolakan wajib diisi' });
        return;
      }
    }
    const res = await fetch(`/api/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, catatan: catatan?.trim() }),
    });
    if (res.ok) {
      await load();
      setMessage({ ok: true, text: action === 'approve' ? 'Pengajuan cuti berhasil disetujui.' : 'Pengajuan cuti berhasil ditolak.' });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data?.error ?? 'Gagal memproses pengajuan' });
    }
  };

  const renderAction = (r: LeaveReq) => {
    if (r.jenis === 'sakit') {
      return (
        <span className="text-[14px] text-amana-neutral-400 italic whitespace-nowrap">
          View Only
        </span>
      );
    }
    if (r.status === 'ST_LEAVE_PENDING') {
      return (
        <ApprovalActions
          disabled={false}
          onApprove={() => handleAction(r.id, 'approve')}
          onReject={() => handleAction(r.id, 'reject')}
        />
      );
    }
    return (
      <span className="text-[14px] text-amana-neutral-400 italic whitespace-nowrap">
        {r.status === 'ST_LEAVE_APPROVED' ? 'Approved' : 'Rejected'}
      </span>
    );
  };

  const columns: DataTableColumn<LeaveReq>[] = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'department', label: 'Department' },
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
    { key: 'action', label: 'Action', width: '240px', render: renderAction },
  ];

  if (loading) {
    return <div className="w-full flex items-center justify-center py-24">Loading...</div>;
  }

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Leave Approval" />

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

      {message && (
        <Modal title={message.ok ? 'Berhasil' : 'Gagal'} onClose={() => setMessage(null)} maxWidth="max-w-md">
          <div className="px-5 py-4 flex flex-col gap-3 bg-amana-neutral-100">
            <p className="text-[15px] text-amana-neutral-500">{message.text}</p>
            <Button variant="primary" onClick={() => setMessage(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}