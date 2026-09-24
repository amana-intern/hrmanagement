'use client';

import { useEffect, useMemo, useState } from 'react';
import PageTopBar from '@/app/components/layout/PageTopBar';
import SectionCard from '@/app/components/layout/SectionCard';
import SearchPanel from '@/app/components/data-display/SearchPanel';
import DataTable from '@/app/components/data-display/DataTable';
import type { DataTableColumn } from '@/app/components/data-display/DataTable';
import StatusPill from '@/app/components/data-display/StatusPill';
import { SearchTextField, SearchSelectField, SearchDateRangeCalendarField } from '@/app/components/forms/SearchFields';
import ComboboxField from '@/app/components/forms/ComboboxField';
import DateField from '@/app/components/forms/DateField';
import Button from '@/app/components/forms/Button';
import Modal from '@/app/components/feedback/Modal';
import StatusModal from '@/app/components/feedback/StatusModal';
import { useFilters } from '@/app/utils/useFilters';
import { formatDateWIB } from '@/app/utils/formatDate';
import PaymentDetailModal, { PaymentDetailRow } from '@/app/components/PaymentDetailModal';
import { parsePaymentDetail } from '@/lib/paymentDetail';
import { CHARGECODE_OPTIONS } from '@/lib/chargecodes';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface PayReq {
  id: string;
  idRequest: string;
  user: string;
  chargecode: string;
  pm: string;
  paymentUnder: string;
  projectID: string;
  status: string;
  createdAt: string | null;
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
  catatan: string | null;
  createdAt: string | null;
  tanggalJadwalPembayaran: string | null;
  attachments?: { fileName?: string | null; fileURL?: string | null; kategori?: string | null }[];
  karyawan?: { nama?: string | null };
  masterKategoriPayment?: { namaKategori?: string | null };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ST_PAY_APPROVED: { label: 'Approved', color: 'bg-amana-success-500' },
  ST_PAY_SCHEDULED: { label: 'Scheduled', color: 'bg-amana-primary-500' },
  ST_PAY_PAID: { label: 'Paid', color: 'bg-amana-neutral-400' },
};

const STATUS_OPTIONS = Object.values(STATUS_MAP).map((v) => v.label);

function mapRows(rows: PaymentRaw[]): PayReq[] {
  return rows.map((c) => {
    const d = parsePaymentDetail(c.detail);
    return {
      id: c.idRequest,
      idRequest: c.idRequest,
      user: c.karyawan?.nama ?? '-',
      chargecode: d.chargecode ?? '-',
      pm: d.submittingAs ?? '-',
      paymentUnder: d.paymentUnder ?? '-',
      projectID: c.projectID ?? '-',
      status: c.idStatus,
      createdAt: c.createdAt ?? null,
      details: null,
      action: null,
      detailRow: {
        idRequest: c.idRequest,
        idKategoriPayment: c.idKategoriPayment,
        nominal: c.nominal,
        projectID: c.projectID,
        detail: c.detail,
        catatan: c.catatan,
        createdAt: c.createdAt,
        tanggalJadwalPembayaran: c.tanggalJadwalPembayaran,
        attachments: c.attachments ?? [],
        masterKategoriPayment: c.masterKategoriPayment,
        statusLabel: STATUS_MAP[c.idStatus]?.label ?? c.idStatus,
      },
    };
  });
}

interface Filters {
  chargecode: string;
  pm: string;
  status: string;
  from: string;
  to: string;
}

const emptyFilters: Filters = { chargecode: '', pm: '', status: '', from: '', to: '' };

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
    const chargecodeQ = applied.chargecode.trim().toLowerCase();
    const pmQ = applied.pm.trim().toLowerCase();
    const from = applied.from ? new Date(applied.from + 'T00:00:00') : null;
    const to = applied.to ? new Date(applied.to + 'T23:59:59') : null;
    return requests.filter((r) => {
      const matchChargecode = !chargecodeQ || r.chargecode.toLowerCase().includes(chargecodeQ);
      const matchPM = !pmQ || r.pm.toLowerCase().includes(pmQ);
      const matchStatus =
        !applied.status || (STATUS_MAP[r.status]?.label ?? r.status) === applied.status;
      const submitted = r.createdAt ? new Date(r.createdAt) : null;
      const matchDate = (!from || (submitted && submitted >= from)) && (!to || (submitted && submitted <= to));
      return matchChargecode && matchPM && matchStatus && matchDate;
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
    const actionText = (label: string) => (
      <span className="text-[14px] text-amana-neutral-400 italic whitespace-nowrap">{label}</span>
    );
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
    // Setelah aksi selesai, tampilkan teks sesuai status, bukan tombol disabled.
    if (r.status === 'ST_PAY_PAID') return actionText('Paid');
    if (r.status === 'ST_PAY_REJECTED') return actionText('Rejected');
    return actionText('Approved');
  };

  const columns: DataTableColumn<PayReq>[] = [
    { key: 'idRequest', label: 'ID', width: '7%', minPx: 75 },
    { key: 'chargecode', label: 'Chargecode', width: '12%', minPx: 125 },
    { key: 'user', label: 'Requester', width: '10%', minPx: 100 },
    { key: 'pm', label: 'PM', width: '9%', minPx: 90 },
    { key: 'paymentUnder', label: 'Payment Under', width: '9%', minPx: 90 },
    {
      key: 'createdAt',
      label: 'Submitted',
      width: '15%',
      minPx: 150,
      sortValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      render: (r) => <span className="whitespace-nowrap">{formatDateWIB(r.createdAt)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      minPx: 120,
      render: (r) => (
        <StatusPill color={STATUS_MAP[r.status]?.color ?? 'bg-amana-neutral-400'}>
          {STATUS_MAP[r.status]?.label ?? r.status}
        </StatusPill>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      width: '8%',
      minPx: 80,
      render: (r) => (
        <Button variant="outline" size="sm" className="w-full whitespace-nowrap" onClick={() => setDetailRow(r.detailRow)}>
          View
        </Button>
      ),
    },
    { key: 'action', label: 'Action', width: '17%', minPx: 165, render: renderAction },
  ];

  if (loading) return <TableSkeleton columns={6} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

        <SearchPanel
          title="Search Payment Schedule"
          subtitle="Filter scheduled payments by Chargecode, Project Manager, Status, or Submitted Date."
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <ComboboxField
            label="Chargecode"
            value={draft.chargecode}
            onChange={(v) => setField('chargecode', v)}
            options={CHARGECODE_OPTIONS}
            placeholder="Type or select chargecode..."
          />
          <SearchTextField
            label="Project Manager"
            value={draft.pm}
            onChange={(v) => setField('pm', v)}
            placeholder="Search..."
          />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={STATUS_OPTIONS} />
          <SearchDateRangeCalendarField
            label="Submitted Date"
            fromValue={draft.from}
            toValue={draft.to}
            onFromChange={(v) => setField('from', v)}
            onToChange={(v) => setField('to', v)}
          />
        </SearchPanel>

        <SectionCard title="Payment Schedule" subtitle={`${filtered.length} payment(s)`} scroll className="flex-1 min-h-[220px]">
          <DataTable
            columns={columns}
            rows={filtered}
            defaultSortKey="createdAt"
            defaultSortDir="desc"
            emptyMessage="No data found."
            compact
          />
        </SectionCard>
      </div>

      {scheduleTarget && (
        <Modal title="Schedule Payment" onClose={() => { setScheduleTarget(null); setScheduleDate(''); }} maxWidth="max-w-md" showCloseButton={false}>
          <div className="p-5 flex flex-col gap-4">
            <p className="text-[15px] text-amana-neutral-500">
              Select payment date for <span className="font-semibold">{scheduleTarget.idRequest}</span>.
            </p>
            <DateField label="Payment Date" value={scheduleDate} onChange={setScheduleDate} />
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!scheduleDate || processingId === scheduleTarget.id}
                onClick={handleConfirmSchedule}
              >
                {processingId === scheduleTarget.id ? 'Processing...' : 'Schedule'}
              </Button>
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
            </div>
          </div>
        </Modal>
      )}

      <StatusModal state={message} onClose={() => setMessage(null)} />

      <PaymentDetailModal open={!!detailRow} row={detailRow} onClose={() => setDetailRow(null)} />
    </>
  );
}