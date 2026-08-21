'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import SearchPanel from '@/app/components/data-display/SearchPanel';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import { SearchTextField, SearchSelectField } from '@/app/components/forms/SearchFields';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import StatusModal from '@/app/components/feedback/StatusModal';
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
  const [scheduleTarget, setScheduleTarget] = useState<PayReq | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);
  const { draft, applied, setField, handleSearch, handleReset } = useFilters<Filters>(emptyFilters);

  const load = async () => {
    const res = await fetch('/api/payment/list?scope=schedule', { cache: 'no-store' });
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
          ? 'Payment schedule successfully set.'
          : action === 'paid'
            ? 'Payment successfully marked as paid.'
            : 'Request successfully processed.';
      setMessage({ ok: true, text });
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ ok: false, text: data?.error || `Failed to process (${res.status})` });
    }
    setProcessingId(null);
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleTarget || !scheduleDate) return;
    await handleAction(scheduleTarget.id, 'schedule', scheduleDate);
    setScheduleTarget(null);
    setScheduleDate('');
  };

  const renderAction = (r: PayReq) => {
    if (r.status === 'ST_PAY_APPROVED') {
      return (
        <Button variant="primary" size="sm" className="w-full" onClick={() => setScheduleTarget(r)}>
          Schedule
        </Button>
      );
    }
    if (r.status === 'ST_PAY_SCHEDULED') {
      return (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={processingId === r.id}
          onClick={() => handleAction(r.id, 'paid')}
        >
          {processingId === r.id ? 'Processing...' : 'Mark Paid'}
        </Button>
      );
    }
    return (
      <Button variant="primary" size="sm" className="w-full" disabled>
        Schedule
      </Button>
    );
  };

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
    { key: 'action', label: 'Action', width: '150px', render: renderAction },
  ];

  if (loading) return <TableSkeleton columns={6} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

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

      {scheduleTarget && (
        <Modal title="Schedule Payment" onClose={() => { setScheduleTarget(null); setScheduleDate(''); }} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-[15px] text-amana-neutral-500">
              Pilih tanggal pembayaran untuk <span className="font-semibold">{scheduleTarget.idRequest}</span>.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[16px] font-semibold text-amana-neutral-500">Payment Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                autoFocus
                className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[15px] text-amana-neutral-500 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={processingId === scheduleTarget.id}
                onClick={() => {
                  setScheduleTarget(null);
                  setScheduleDate('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!scheduleDate || processingId === scheduleTarget.id}
                onClick={handleConfirmSchedule}
              >
                {processingId === scheduleTarget.id ? 'Processing...' : 'Schedule'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <StatusModal state={message} onClose={() => setMessage(null)} />

      <PaymentDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}