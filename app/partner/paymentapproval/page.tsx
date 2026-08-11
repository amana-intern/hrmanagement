'use client';

import { useMemo, useState } from 'react';
import { PageTopBar, SearchPanel, SearchTextField, SearchSelectField, SectionCard, DataTable, StatusPill, ApprovalActions } from '../../components/ui';
import type { DataTableColumn } from '../../components/ui';
import { useFilters } from '@/app/utils/useFilters';
import { statusColor } from '@/app/utils/statusColor';

type Status = 'Pending' | 'Approved' | 'Rejected';

interface PaymentRequest {
  id: string;
  name: string;
  type: string;
  amount: string;
  date: string;
  status: Status;
}

const initialRequests: PaymentRequest[] = [
  { id: 'REQ-003', name: 'Budi Hartono', type: 'Per-Diem', amount: 'Rp. 8.000.000,-', date: '20 July 2026', status: 'Pending' },
  { id: 'REQ-005', name: 'Dimas Prayoga', type: 'Individual', amount: 'Rp. 2.000.000,-', date: '18 July 2026', status: 'Pending' },
  { id: 'REQ-007', name: 'Fitri Handayani', type: 'Vendor', amount: 'Rp. 5.500.000,-', date: '14 July 2026', status: 'Pending' },
];

const typeOptions = ['Vendor', 'Individual', 'Per-Diem'];
const statusOptions: Status[] = ['Pending', 'Approved', 'Rejected'];

interface Filters {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
}

const emptyFilters: Filters = { id: '', name: '', type: '', date: '', status: '' };

export default function PartnerPaymentApprovalPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>(initialRequests);

  const { draft, applied, setField, handleSearch, handleReset } = useFilters(emptyFilters);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (applied.id && !r.id.toLowerCase().includes(applied.id.toLowerCase())) return false;
      if (applied.name && !r.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.type && r.type !== applied.type) return false;
      if (applied.status && r.status !== applied.status) return false;
      if (applied.date && !r.date.toLowerCase().includes(applied.date.toLowerCase())) return false;
      return true;
    });
  }, [requests, applied]);

  const handleAction = (reqId: string, action: 'Approved' | 'Rejected') => {
    setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: action } : r)));
  };

  const columns: DataTableColumn<PaymentRequest>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Requester' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date', sortValue: (r) => new Date(r.date).getTime() },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusPill color={statusColor(r.status)}>{r.status}</StatusPill>,
    },
    {
      key: 'actions' as keyof PaymentRequest,
      label: 'Actions',
      width: '220px',
      render: (r) => (
        <ApprovalActions
          disabled={r.status !== 'Pending'}
          onReject={() => handleAction(r.id, 'Rejected')}
          onApprove={() => handleAction(r.id, 'Approved')}
        />
      ),
    },
  ];

  return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Payment Approval" />

        <SearchPanel title="Payment Approval Filter" subtitle="Filter payment requests based on ID, Requester, Type, date, and Status" onReset={handleReset} onSearch={handleSearch}>
          <SearchTextField label="ID" value={draft.id} onChange={(v) => setField('id', v)} placeholder="Search by ID..." />
          <SearchTextField label="Requester" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
          <SearchSelectField label="Type" value={draft.type} onChange={(v) => setField('type', v)} options={typeOptions} />
          <SearchTextField label="Date" value={draft.date} onChange={(v) => setField('date', v)} placeholder="Search by date..." />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={statusOptions} />
        </SearchPanel>

        <SectionCard title="Payment Request" scroll>
          <DataTable columns={columns} rows={filtered} defaultSortKey="id" emptyMessage="No payment requests match your filters." />
        </SectionCard>
      </div>
  );
}
