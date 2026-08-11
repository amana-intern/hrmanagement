'use client';

import { useMemo, useState } from 'react';
import { PageTopBar, SearchPanel, SearchTextField, SearchSelectField, SectionCard, DataTable, StatusPill, ApprovalActions } from '../../components/ui';
import type { DataTableColumn } from '../../components/ui';
import { DEPARTMENT_OPTIONS, getGradeOptions, getAllGradeOptions } from '@/app/utils/orgStructure';
import { useFilters } from '@/app/utils/useFilters';
import { statusColor } from '@/app/utils/statusColor';

type Status = 'Pending' | 'Approved' | 'Rejected';

interface LeaveRequest {
  id: number;
  name: string;
  department: string;
  grade: string;
  leaveType: string;
  dates: string;
  status: Status;
}

const initialRequests: LeaveRequest[] = [
  { id: 1, name: 'Ahmad Fauzi', department: 'Digital and Finance', grade: 'Senior Analyst', leaveType: 'Paid Leave', dates: '25 Jul 2026 - 27 Jul 2026', status: 'Pending' },
  { id: 2, name: 'Sari Dewi', department: 'Health and Wellbeing', grade: 'Associate', leaveType: 'Special Leave', dates: '28 Jul 2026 - 30 Jul 2026', status: 'Pending' },
  { id: 3, name: 'Budi Hartono', department: 'Digital and Finance', grade: 'Analyst', leaveType: 'Paid Leave', dates: '01 Aug 2026 - 05 Aug 2026', status: 'Pending' },
];

const leaveTypeOptions = ['Paid Leave', 'Unpaid Leave', 'Special Leave'];
const departmentOptions = DEPARTMENT_OPTIONS;
const statusOptions: Status[] = ['Pending', 'Approved', 'Rejected'];

interface Filters {
  name: string;
  department: string;
  grade: string;
  leaveType: string;
  status: string;
}

const emptyFilters: Filters = { name: '', department: '', grade: '', leaveType: '', status: '' };

export default function PartnerLeaveApprovalPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);

  const { draft, applied, setField, handleSearch, handleReset } = useFilters(emptyFilters);

  const gradeOptions = useMemo(() => (draft.department ? getGradeOptions(draft.department) : getAllGradeOptions()), [draft.department]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (applied.name && !r.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.department && r.department !== applied.department) return false;
      if (applied.grade && r.grade !== applied.grade) return false;
      if (applied.leaveType && r.leaveType !== applied.leaveType) return false;
      if (applied.status && r.status !== applied.status) return false;
      return true;
    });
  }, [requests, applied]);

  const handleDepartmentChange = (v: string) => {
    setField('department', v);
    setField('grade', '');
  };

  const handleAction = (id: number, action: 'Approved' | 'Rejected') => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'grade', label: 'Grade' },
    { key: 'leaveType', label: 'Leave Type' },
    { key: 'dates', label: 'Dates' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusPill color={statusColor(r.status)}>{r.status}</StatusPill>,
    },
    {
      key: 'id',
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
        <PageTopBar showGreeting section="Career Hub" page="Leave Approval" />

        <SearchPanel title="Leave Approval Filter" subtitle="Filter leave requests based on Name, Department, Grade, Leave Type, and Status" onReset={handleReset} onSearch={handleSearch}>
          <SearchTextField label="Employee Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
          <SearchSelectField label="Department" value={draft.department} onChange={handleDepartmentChange} options={departmentOptions} />
          <SearchSelectField label="Grade" value={draft.grade} onChange={(v) => setField('grade', v)} options={gradeOptions} />
          <SearchSelectField label="Leave Type" value={draft.leaveType} onChange={(v) => setField('leaveType', v)} options={leaveTypeOptions} />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={statusOptions} />
        </SearchPanel>

        <SectionCard title="Leave Request" scroll>
          <DataTable columns={columns} rows={filtered} defaultSortKey="name" emptyMessage="No leave requests match your filters." />
        </SectionCard>
      </div>
  );
}
