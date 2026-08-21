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
import StatusModal from '@/app/components/feedback/StatusModal';
import RejectReasonModal from '@/app/components/feedback/RejectReasonModal';
import { useFilters } from '@/app/utils/useFilters';
import PaymentDetailModal, { PaymentDetailRow } from '@/app/components/PaymentDetailModal';
import { PAYMENT_KATEGORI } from '@/lib/constants';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface PayReq {
  id: string;
  idRequest: string;
  user: string;
  type: string;
  amount: string;
  projectID: string;
  status: string;
  details: null;
  action: null;
  detailRow: PaymentDetailRow;
}

interface PaymentRaw {
  idRequest: string;
  idStatus: string;
  idKategoriPayment: string;
  nominal: string | number;
  projectID: string | null;
  detail: string | null;
  createdAt: string | null;
  attachments?: { fileName?: string | null; fileURL?: string | null; kategori?: string | null }[];
  karyawan?: { nama?: string | null };
  masterKategoriPayment?: { namaKategori?: string | null };
}

function amountLabel(c: PaymentRaw): string {
  if (c.idKategoriPayment === PAYMENT_KATEGORI.PER_DIEM) {
    try {
      const detail = typeof c.detail === 'string' ? JSON.parse(c.detail) : c.detail;
      const p = Number(detail?.perDiemParticipants);
      if (Number.isFinite(p) && p > 0) return `${p} peserta`;
    } catch {}
    return 'Lihat file';
  }
  return `Rp ${Number(c.nominal).toLocaleString('id-ID')}`;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ST_PAY_PENDING_OPS: { label: 'Pending Ops', color: 'bg-amana-warning-500' },
  ST_PAY_PENDING_PARTNER: { label: 'Waiting Partner', color: 'bg-amana-primary-500' },
  ST_PAY_REJECTED: { label: 'Rejected', color: 'bg-amana-danger-500' },
};

const STATUS_OPTIONS = Object.values(STATUS_MAP).map((v) => v.label);

function mapRows(rows: PaymentRaw[]): PayReq[] {
  return rows.map((c) => ({
    id: c.idRequest,
    idRequest: c.idRequest,
    user: c.karyawan?.nama ?? '-',
    type: c.masterKategoriPayment?.namaKategori ?? '-',
    amount: amountLabel(c),
    projectID: c.projectID ?? '-',
    status: c.idStatus,
    details: null,
    action: null,
    detailRow: {
      idRequest: c.idRequest,
      idKategoriPayment: c.idKategoriPayment,
      nominal: c.nominal,
      projectID: c.projectID,
      detail: c.detail,
      createdAt: c.createdAt,
      attachments: c.attachments ?? [],
      masterKategoriPayment: c.masterKategoriPayment,
    },
  }));
}

interface Filters {
  search: string;
  status: string;
}

const emptyFilters: Filters = { search: '', status: '' };

export default function PaymentRequestPage() {
  const [requests, setRequests] = useState<PayReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  const load = async () => {
    const res = await fetch('/api/payment/list?scope=pending', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setRequests(mapRows((data.list ?? []) as PaymentRaw[]));
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || 'Failed to load data' });
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
      const matchSearch =
        !q ||
        r.idRequest.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.projectID.toLowerCase().includes(q);
      const matchStatus =
        !applied.status || (STATUS_MAP[r.status]?.label ?? r.status) === applied.status;
      return matchSearch && matchStatus;
    });
  }, [requests, applied]);

  const handleAction = async (id: string, action: string, catatan?: string) => {
    if (processingId) return; // cegah double-processing
    setProcessingId(id);
    const res = await fetch(`/api/payment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(catatan ? { catatan: catatan.trim() } : {}) }),
    });
    if (res.ok) {
      await load();
      setMessage({ ok: true, text: action === 'reject' ? 'Request successfully rejected.' : 'Request successfully processed.' });
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || `Failed to process (${res.status})` });
    }
    setProcessingId(null);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setRejectTarget(null);
    await handleAction(id, 'reject', reason);
  };

  const renderAction = (r: PayReq) => (
    <ApprovalActions
      disabled={r.status !== 'ST_PAY_PENDING_OPS' || processingId === r.id}
      onApprove={() => handleAction(r.id, 'review_approve')}
      onReject={() => setRejectTarget(r.id)}
    />
  );

  const columns: DataTableColumn<PayReq>[] = [
    { key: 'idRequest', label: 'ID', width: '170px' },
    { key: 'user', label: 'Requester', width: '140px' },
    { key: 'type', label: 'Type', width: '110px' },
    { key: 'projectID', label: 'Event/Vendor Name', width: '170px' },
    {
      key: 'amount',
      label: 'Amount',
      width: '120px',
      render: (r) => <span className="font-semibold whitespace-nowrap">{r.amount}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (r) => (
        <StatusPill color={STATUS_MAP[r.status]?.color ?? 'bg-amana-neutral-400'}>
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
    { key: 'action', label: 'Action', width: '180px', render: renderAction },
  ];

  if (loading) return <TableSkeleton columns={6} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

        <SearchPanel
          title="Search Payment Request"
          subtitle="Filter payment requests by ID, requester, event/vendor name, or status."
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <SearchTextField
            label="ID / Requester / Event"
            value={draft.search}
            onChange={(v) => setField('search', v)}
            placeholder="Search..."
          />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={STATUS_OPTIONS} />
        </SearchPanel>

        <SectionCard title="Payment Request List" subtitle={`${filtered.length} request(s)`} scroll>
          <DataTable
            columns={columns}
            rows={filtered}
            defaultSortKey="idRequest"
            emptyMessage="Tidak ada pengajuan."
          />
        </SectionCard>
      </div>

      {rejectTarget && (
        <RejectReasonModal onCancel={() => setRejectTarget(null)} onConfirm={handleConfirmReject} submitting={!!processingId} />
      )}

      <StatusModal state={message} onClose={() => setMessage(null)} />

      <PaymentDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}
