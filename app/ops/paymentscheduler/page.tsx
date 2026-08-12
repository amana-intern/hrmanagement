'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '../../components/layout/PageTopBar';
import SectionCard from '../../components/layout/SectionCard';
import SearchPanel from '../../components/data-display/SearchPanel';
import DataTable from '../../components/data-display/DataTable';
import type { DataTableColumn } from '../../components/data-display/DataTable';
import StatusPill from '../../components/data-display/StatusPill';
import { SearchTextField, SearchSelectField } from '../../components/forms/SearchFields';
import Button from '../../components/forms/Button';
import Modal from '../../components/feedback/Modal';
import { useFilters } from '@/app/utils/useFilters';
import PaymentDetailModal, { PaymentDetailRow } from '../../components/PaymentDetailModal';
import { PAYMENT_KATEGORI } from '@/lib/constants';

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
  ST_PAY_APPROVED: { label: 'Approved', color: 'bg-amana-success-500' },
  ST_PAY_SCHEDULED: { label: 'Scheduled', color: 'bg-amana-primary-500' },
  ST_PAY_PAID: { label: 'Paid', color: 'bg-amana-neutral-400' },
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

export default function PaymentSchedulerPage() {
  const [requests, setRequests] = useState<PayReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({});
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  const load = async () => {
    const res = await fetch('/api/payment/list?scope=schedule', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setRequests(mapRows((data.list ?? []) as PaymentRaw[]));
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || 'Gagal memuat data' });
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

  const handleAction = async (id: string, action: string, tanggalPembayaran?: string) => {
    if (processingId) return; // cegah double-processing
    setProcessingId(id);
    const res = await fetch(`/api/payment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(tanggalPembayaran ? { tanggalPembayaran } : {}) }),
    });
    if (res.ok) {
      await load();
      const text =
        action === 'schedule'
          ? 'Jadwal pembayaran berhasil diatur.'
          : action === 'paid'
            ? 'Pembayaran berhasil ditandai lunas.'
            : 'Pengajuan berhasil diproses.';
      setMessage({ ok: true, text });
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || `Gagal memproses (${res.status})` });
    }
    setProcessingId(null);
  };

  const renderAction = (r: PayReq) => {
    if (r.status === 'ST_PAY_APPROVED') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={scheduleDates[r.id] ?? ''}
            onChange={(e) => setScheduleDates((prev) => ({ ...prev, [r.id]: e.target.value }))}
            className="px-2 py-1.5 border border-amana-neutral-300 rounded-lg text-[14px] outline-none focus:border-amana-primary-500 bg-amana-neutral-100"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={processingId === r.id}
            onClick={() => handleAction(r.id, 'schedule', scheduleDates[r.id])}
          >
            {processingId === r.id ? 'Processing...' : 'Schedule'}
          </Button>
        </div>
      );
    }
    if (r.status === 'ST_PAY_SCHEDULED') {
      return (
        <Button
          variant="primary"
          size="sm"
          disabled={processingId === r.id}
          onClick={() => handleAction(r.id, 'paid')}
        >
          {processingId === r.id ? 'Processing...' : 'Mark Paid'}
        </Button>
      );
    }
    return <span className="text-[14px] text-emerald-600 italic whitespace-nowrap">Lunas</span>;
  };

  const columns: DataTableColumn<PayReq>[] = [
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
    { key: 'action', label: 'Action', width: '280px', render: renderAction },
  ];

  if (loading) {
    return <div className="w-full flex items-center justify-center py-24">Loading...</div>;
  }

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Payment Scheduler" />

        <SearchPanel
          title="Search Payment Schedule"
          subtitle="Filter scheduled payments by ID, requester, event/vendor name, or status."
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

        <SectionCard title="Payment Schedule" subtitle={`${filtered.length} payment(s)`} scroll>
          <DataTable
            columns={columns}
            rows={filtered}
            defaultSortKey="idRequest"
            emptyMessage="Tidak ada data."
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

      <PaymentDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}