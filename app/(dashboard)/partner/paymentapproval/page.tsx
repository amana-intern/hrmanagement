'use client';

import { useState } from 'react';
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
import PaymentDetailModal, { PaymentDetailRow } from '@/app/components/PaymentDetailModal';
import { usePaymentRequests } from '@/app/utils/usePaymentRequests';
import { paymentStatusLabel, paymentStatusColor, type PayReq } from '@/app/utils/payment';
import { PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from '@/lib/constants';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

const STATUS_OPTIONS = Object.values(PAYMENT_STATUS_LABELS);

export default function PartnerPaymentApprovalPage() {
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
  } = usePaymentRequests('partner');
  const [detailRow, setDetailRow] = useState<PaymentDetailRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'final_approve' | 'reject', catatan?: string) => {
    const ok = await submitAction(id, action, catatan ? { catatan: catatan.trim() } : undefined);
    if (ok) setMessage({ ok: true, text: action === 'final_approve' ? 'Request successfully approved.' : 'Request successfully rejected.' });
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setRejectTarget(null);
    await handleAction(id, 'reject', reason);
  };

  const renderAction = (r: PayReq) => (
    <ApprovalActions
      disabled={r.status !== PAYMENT_STATUS.PENDING_PARTNER || processingId === r.id}
      onApprove={() => handleAction(r.id, 'final_approve')}
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
    { key: 'action', label: 'Action', width: '180px', render: renderAction },
  ];

  if (loading) return <TableSkeleton columns={6} />;

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting />

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
            emptyMessage="No payment requests match your filters."
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
