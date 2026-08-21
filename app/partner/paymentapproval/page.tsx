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
import { useFilters } from '@/app/utils/useFilters';
import { statusColor } from '@/app/utils/statusColor';
import PaymentDetailModal, { PaymentDetailRow } from '../../components/PaymentDetailModal';
import { formatDateTimeWIB } from '@/app/utils/formatDate';
import { PAYMENT_KATEGORI } from '@/lib/constants';

interface PayReq {
  id: string;
  idRequest: string;
  user: string;
  type: string;
  amount: string;
  projectID: string;
  submitted: string;
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
  karyawan?: { nama?: string | null; department?: string | null };
  masterKategoriPayment?: { namaKategori?: string | null };
}

function amountLabel(c: PaymentRaw): string {
  if (c.idKategoriPayment === PAYMENT_KATEGORI.PER_DIEM) {
    try {
      const detail = typeof c.detail === 'string' ? JSON.parse(c.detail) : c.detail;
      const p = Number(detail?.perDiemParticipants);
      if (Number.isFinite(p) && p > 0) return `${p} participant(s)`;
    } catch {}
    return 'View file';
  }
  return `Rp ${Number(c.nominal).toLocaleString('id-ID')}`;
}

const STATUS_MAP: Record<string, { label: string }> = {
  ST_PAY_PENDING_PARTNER: { label: 'Pending Partner' },
  ST_PAY_APPROVED: { label: 'Approved' },
  ST_PAY_REJECTED: { label: 'Rejected' },
  ST_PAY_SCHEDULED: { label: 'Scheduled' },
  ST_PAY_PAID: { label: 'Paid' },
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
    submitted: formatDateTimeWIB(c.createdAt),
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
      karyawan: c.karyawan,
    },
  }));
}

interface Filters {
  search: string;
  status: string;
}

const emptyFilters: Filters = { search: '', status: '' };

export default function PartnerPaymentApprovalPage() {
  const [requests, setRequests] = useState<PayReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  const load = async () => {
    const res = await fetch('/api/payment/list?scope=partner', { cache: 'no-store' });
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

  const handleAction = async (id: string, action: 'final_approve' | 'reject') => {
    let catatan: string | null = null;
    if (action === 'reject') {
      catatan = window.prompt('Rejection reason (required):');
      if (catatan === null) return;
      if (!catatan.trim()) {
        setMessage({ ok: false, text: 'Rejection reason is required' });
        return;
      }
    }
    const res = await fetch(`/api/payment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, catatan: catatan?.trim() }),
    });
    if (res.ok) {
      await load();
      setMessage({ ok: true, text: action === 'final_approve' ? 'Request approved.' : 'Request rejected.' });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data?.error ?? 'Failed to process request' });
    }
  };

  const renderAction = (r: PayReq) => {
    if (r.status === 'ST_PAY_PENDING_PARTNER') {
      return (
        <ApprovalActions
          disabled={false}
          onApprove={() => handleAction(r.id, 'final_approve')}
          onReject={() => handleAction(r.id, 'reject')}
        />
      );
    }
    return (
      <span className="text-[14px] text-amana-neutral-400 italic whitespace-nowrap">
        {STATUS_MAP[r.status]?.label ?? r.status}
      </span>
    );
  };

  const columns: DataTableColumn<PayReq>[] = [
    { key: 'submitted', label: 'Submitted', sortValue: (r) => (r.submitted === '-' ? 0 : 1) },
    { key: 'idRequest', label: 'ID', width: '200px' },
    { key: 'user', label: 'Requester' },
    { key: 'type', label: 'Type' },
    { key: 'projectID', label: 'Event/Vendor Name' },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => <span className="font-semibold whitespace-nowrap">{r.amount}</span>,
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
    {
      key: 'details',
      label: 'Details',
      width: '140px',
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => setDetailRow(r.detailRow)}>
          View Details
        </Button>
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
        <PageTopBar showGreeting section="Approvals" page="Payment Approval" />

        <SearchPanel
          title="Search Payment Approval"
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

        <SectionCard title="Payment Approval List" subtitle={`${filtered.length} request(s)`} scroll>
          <DataTable
            columns={columns}
            rows={filtered}
            defaultSortKey="idRequest"
            emptyMessage="No requests found."
          />
        </SectionCard>
      </div>

      {message && (
        <Modal title={message.ok ? 'Success' : 'Failed'} onClose={() => setMessage(null)} maxWidth="max-w-md">
          <div className="px-5 py-4 flex flex-col gap-3 bg-amana-neutral-100">
            <p className="text-[15px] text-amana-neutral-500">{message.text}</p>
            <Button variant="primary" onClick={() => setMessage(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      <PaymentDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}