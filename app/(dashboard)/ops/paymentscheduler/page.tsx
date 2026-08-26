'use client';

import { useState } from 'react';
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
import PaymentDetailModal, { PaymentDetailRow } from '@/app/components/PaymentDetailModal';
import { usePaymentRequests } from '@/app/utils/usePaymentRequests';
import { paymentStatusLabel, paymentStatusColor, type PayReq } from '@/app/utils/payment';
import { PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from '@/lib/constants';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

const STATUS_OPTIONS = [PAYMENT_STATUS.APPROVED, PAYMENT_STATUS.SCHEDULED, PAYMENT_STATUS.PAID].map(
  (s) => PAYMENT_STATUS_LABELS[s]
);

export default function PaymentSchedulerPage() {
  const {
    loading,
    filtered,
    message,
    setMessage,
    processingId,
    submitAction,
    draft,
    setField,
    handleSearch,
    handleReset,
  } = usePaymentRequests('schedule');
  const [scheduleTarget, setScheduleTarget] = useState<PayReq | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);

  const handleAction = async (id: string, action: string, tanggalPembayaran?: string) => {
    const ok = await submitAction(id, action, tanggalPembayaran ? { tanggalPembayaran } : undefined);
    if (ok) {
      const text =
        action === 'schedule'
          ? 'Payment schedule successfully set.'
          : action === 'paid'
            ? 'Payment successfully marked as paid.'
            : 'Request successfully processed.';
      setMessage({ ok: true, text });
    }
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleTarget || !scheduleDate) return;
    await handleAction(scheduleTarget.id, 'schedule', scheduleDate);
    setScheduleTarget(null);
    setScheduleDate('');
  };

  const renderAction = (r: PayReq) => {
    if (r.status === PAYMENT_STATUS.APPROVED) {
      return (
        <Button variant="primary" size="sm" className="w-full" onClick={() => setScheduleTarget(r)}>
          Schedule
        </Button>
      );
    }
    if (r.status === PAYMENT_STATUS.SCHEDULED) {
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
      render: (r) => <StatusPill color={paymentStatusColor(r.status)}>{paymentStatusLabel(r.status)}</StatusPill>,
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
            emptyMessage="No scheduled payments match your filters."
          />
        </SectionCard>
      </div>

      {scheduleTarget && (
        <Modal title="Schedule Payment" onClose={() => { setScheduleTarget(null); setScheduleDate(''); }} maxWidth="max-w-md">
          <div className="p-5 flex flex-col gap-4">
            <p className="text-[15px] text-amana-neutral-500">
              Select a payment date for <span className="font-semibold">{scheduleTarget.idRequest}</span>.
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
