'use client';

import { useMemo, useState } from 'react';
import { PageTopBar, SearchPanel, SearchTextField, SearchSelectField, SectionCard, DataTable, StatusPill, ApprovalActions } from '../../components/ui';
import type { DataTableColumn } from '../../components/ui';
import { useFilters } from '@/app/utils/useFilters';

type Status = 'Waiting Partner' | 'Rejected' | 'Pending';

interface PaymentRequest {
  id: string;
  name: string;
  type: string;
  amount: string;
  date: string;
  status: Status;
}

const initialRequests: PaymentRequest[] = [
  { id: 'REQ-001', name: 'Ahmad Fauzi', type: 'Vendor', amount: 'Rp. 1.500.000,-', date: '11 August 2026', status: 'Waiting Partner' },
  { id: 'REQ-002', name: 'Sari Dewi', type: 'Individual', amount: 'Rp. 1.600.000,-', date: '1 August 2026', status: 'Rejected' },
  { id: 'REQ-003', name: 'Budi Hartono', type: 'Per-Diem', amount: 'Rp. 1.700.000,-', date: '31 October 2026', status: 'Pending' },
  { id: 'REQ-004', name: 'Citra Lestari', type: 'Vendor', amount: 'Rp. 1.800.000,-', date: '5 October 2026', status: 'Pending' },
  { id: 'REQ-005', name: 'Dimas Prayoga', type: 'Individual', amount: 'Rp. 1.900.000,-', date: '11 August 2026', status: 'Waiting Partner' },
  { id: 'REQ-006', name: 'Eka Pratiwi', type: 'Per-Diem', amount: 'Rp. 2.000.000,-', date: '1 August 2026', status: 'Rejected' },
  { id: 'REQ-007', name: 'Fitri Handayani', type: 'Vendor', amount: 'Rp. 2.100.000,-', date: '31 October 2026', status: 'Pending' },
  { id: 'REQ-008', name: 'Gilang Ramadhan', type: 'Individual', amount: 'Rp. 2.200.000,-', date: '5 October 2026', status: 'Pending' },
];

const typeOptions = ['Vendor', 'Individual', 'Per-Diem'];
const statusOptions: Status[] = ['Waiting Partner', 'Rejected', 'Pending'];

const statusStyle: Record<Status, string> = {
  'Waiting Partner': 'bg-amana-success-500',
  Rejected: 'bg-amana-danger-500',
  Pending: 'bg-amana-warning-500',
};

interface Filters {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
}

const emptyFilters: Filters = { id: '', name: '', type: '', date: '', status: '' };

export default function PaymentRequestPage() {
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

  const handleAction = (reqId: string, action: 'approved' | 'rejected') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: action === 'approved' ? 'Waiting Partner' : 'Rejected' } : r))
    );
  };

  const columns: DataTableColumn<PaymentRequest>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date', sortValue: (r) => new Date(r.date).getTime() },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusPill color={statusStyle[r.status]}>{r.status}</StatusPill>,
    },
    {
      key: 'actions' as keyof PaymentRequest,
      label: 'Actions',
      width: '220px',
      render: (r) => (
        <ApprovalActions
          disabled={r.status !== 'Pending'}
          onReject={() => handleAction(r.id, 'rejected')}
          onApprove={() => handleAction(r.id, 'approved')}
        />
      ),
    },
  ];

  return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Payment Request" />

        <SearchPanel
          title="Payment Request Filter"
          subtitle="Filter employee payment request based on ID, Name, Type, date, and Status"
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <SearchTextField label="ID" value={draft.id} onChange={(v) => setField('id', v)} placeholder="Search by ID..." />
          <SearchTextField label="Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
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
