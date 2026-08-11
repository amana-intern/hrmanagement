'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageTopBar, SearchPanel, SearchTextField, SearchSelectField, SectionCard, DataTable, Button, TextField, StatusPill, Modal } from '../../components/ui';
import type { DataTableColumn } from '../../components/ui';
import { useFilters } from '@/app/utils/useFilters';

type Status = 'Scheduled' | 'Waiting Schedule';

interface PaymentSchedule {
  id: string;
  name: string;
  type: string;
  amount: string;
  date: string;
  status: Status;
}

const initialSchedules: PaymentSchedule[] = [
  { id: 'REQ-001', name: 'Ahmad Fauzi', type: 'Vendor', amount: 'Rp. 1.500.000,-', date: '11 August 2026', status: 'Scheduled' },
  { id: 'REQ-002', name: 'Sari Dewi', type: 'Individual', amount: 'Rp. 1.600.000,-', date: '1 August 2026', status: 'Waiting Schedule' },
  { id: 'REQ-003', name: 'Budi Hartono', type: 'Per-Diem', amount: 'Rp. 1.700.000,-', date: '31 October 2026', status: 'Waiting Schedule' },
  { id: 'REQ-004', name: 'Citra Lestari', type: 'Vendor', amount: 'Rp. 1.800.000,-', date: '5 October 2026', status: 'Waiting Schedule' },
  { id: 'REQ-005', name: 'Dimas Prayoga', type: 'Individual', amount: 'Rp. 1.900.000,-', date: '11 August 2026', status: 'Scheduled' },
  { id: 'REQ-006', name: 'Eka Pratiwi', type: 'Per-Diem', amount: 'Rp. 2.000.000,-', date: '1 August 2026', status: 'Waiting Schedule' },
  { id: 'REQ-007', name: 'Fitri Handayani', type: 'Vendor', amount: 'Rp. 2.100.000,-', date: '31 October 2026', status: 'Waiting Schedule' },
  { id: 'REQ-008', name: 'Gilang Ramadhan', type: 'Individual', amount: 'Rp. 2.200.000,-', date: '5 October 2026', status: 'Waiting Schedule' },
];

const typeOptions = ['Vendor', 'Individual', 'Per-Diem'];
const statusOptions: Status[] = ['Scheduled', 'Waiting Schedule'];

const statusStyle: Record<Status, string> = {
  Scheduled: 'bg-amana-success-500',
  'Waiting Schedule': 'bg-amana-warning-500',
};

interface Filters {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
}

const emptyFilters: Filters = { id: '', name: '', type: '', date: '', status: '' };

function ScheduleModal({
  request,
  onClose,
  onConfirm,
}: {
  request: PaymentSchedule;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const [scheduleDate, setScheduleDate] = useState('');

  return (
    <Modal title="Schedule Payment" onClose={onClose} maxWidth="max-w-md">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[16px] font-semibold text-amana-neutral-500">ID</label>
          <input
            value={request.id}
            readOnly
            className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-400 bg-amana-neutral-200 cursor-not-allowed focus:outline-none"
          />
        </div>

        <TextField label="Schedule Payment Date" type="date" value={scheduleDate} onChange={setScheduleDate} />
      </div>

      <div className="flex-shrink-0 flex justify-end px-5 py-4 border-t border-amana-neutral-200">
        <Button variant="primary" size="lg" className="w-full" disabled={!scheduleDate} onClick={() => onConfirm(scheduleDate)}>
          Schedule Payment
        </Button>
      </div>
    </Modal>
  );
}

export default function PaymentSchedulerPage() {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>(initialSchedules);
  const [scheduling, setScheduling] = useState<PaymentSchedule | null>(null);

  const { draft, applied, setField, handleSearch, handleReset } = useFilters(emptyFilters);

  const filtered = useMemo(() => {
    return schedules.filter((r) => {
      if (applied.id && !r.id.toLowerCase().includes(applied.id.toLowerCase())) return false;
      if (applied.name && !r.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.type && r.type !== applied.type) return false;
      if (applied.status && r.status !== applied.status) return false;
      if (applied.date && !r.date.toLowerCase().includes(applied.date.toLowerCase())) return false;
      return true;
    });
  }, [schedules, applied]);

  const handleConfirmSchedule = (scheduleDate: string) => {
    if (!scheduling) return;
    setSchedules((prev) => prev.map((r) => (r.id === scheduling.id ? { ...r, status: 'Scheduled', date: scheduleDate } : r)));
    setScheduling(null);
  };

  const columns: DataTableColumn<PaymentSchedule>[] = [
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
      key: 'actions' as keyof PaymentSchedule,
      label: 'Actions',
      width: '180px',
      render: (r) => (
        <Button variant="primary" size="sm" className="w-full whitespace-nowrap" disabled={r.status !== 'Waiting Schedule'} onClick={() => setScheduling(r)}>
          {r.status === 'Waiting Schedule' ? 'Schedule Payment' : 'Payment Scheduled'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Payment Scheduler" />

        <SearchPanel
          title="Payment Schedule Filter"
          subtitle="Filter employee payment schedule based on ID, Name, Type, date, and Status"
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <SearchTextField label="ID" value={draft.id} onChange={(v) => setField('id', v)} placeholder="Search by ID..." />
          <SearchTextField label="Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
          <SearchSelectField label="Type" value={draft.type} onChange={(v) => setField('type', v)} options={typeOptions} />
          <SearchTextField label="Date" value={draft.date} onChange={(v) => setField('date', v)} placeholder="Search by date..." />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={statusOptions} />
        </SearchPanel>

        <SectionCard title="Payment Schedule" scroll>
          <DataTable columns={columns} rows={filtered} defaultSortKey="id" emptyMessage="No payment schedules match your filters." />
        </SectionCard>
      </div>

      <AnimatePresence>
        {scheduling && (
          <ScheduleModal request={scheduling} onClose={() => setScheduling(null)} onConfirm={handleConfirmSchedule} />
        )}
      </AnimatePresence>
    </>
  );
}
