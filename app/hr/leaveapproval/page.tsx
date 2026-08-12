'use client';

import { useMemo } from 'react';
import { PageTopBar, SearchPanel, SearchTextField, SearchSelectField, SectionCard, DataTable, StatusPill } from '../../components/ui';
import type { DataTableColumn } from '../../components/ui';
import { DEPARTMENT_OPTIONS, getGradeOptions, getAllGradeOptions } from '@/app/utils/orgStructure';
import { useFilters } from '@/app/utils/useFilters';
import { statusColor } from '@/app/utils/statusColor';

type Status = 'Partner Pending' | 'Partner Approved' | 'Partner Rejected';

interface LeaveRecord {
  id: number;
  name: string;
  department: string;
  grade: string;
  submitted: string;
  duration: string;
  leaveType: string;
  status: Status;
}

// Same roster as Contract Tracking, so employees stay consistent across HR pages.
const records: LeaveRecord[] = [
  { id: 1, name: 'Citra Lestari', department: 'Digital and Finance', grade: 'Analyst', submitted: '11 August 2026', duration: '1 Day(s)', leaveType: 'Special Leave', status: 'Partner Approved' },
  { id: 2, name: 'Dimas Prayoga', department: 'Digital and Finance', grade: 'Senior Analyst', submitted: '1 August 2026', duration: '11 Day(s)', leaveType: 'Unpaid Leave', status: 'Partner Rejected' },
  { id: 3, name: 'Eka Pratiwi', department: 'Health and Wellbeing', grade: 'Associate', submitted: '31 October 2026', duration: '1 Day(s)', leaveType: 'Paid Leave', status: 'Partner Pending' },
  { id: 4, name: 'Fitri Handayani', department: 'Education and HR', grade: 'Senior Associate', submitted: '5 October 2026', duration: '4 Day(s)', leaveType: 'Paid Leave', status: 'Partner Pending' },

];

const leaveTypeOptions = ['Paid Leave', 'Unpaid Leave', 'Special Leave'];
const departmentOptions = DEPARTMENT_OPTIONS;
const durationOptions = ['<= 7 Days', '>= 7 Days'];
const statusOptions: Status[] = ['Partner Pending', 'Partner Approved', 'Partner Rejected'];

const columns: DataTableColumn<LeaveRecord>[] = [
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'grade', label: 'Grade' },
  { key: 'submitted', label: 'Submitted', sortValue: (r) => new Date(r.submitted).getTime() },
  { key: 'duration', label: 'Duration', sortValue: (r) => parseInt(r.duration, 10) },
  { key: 'leaveType', label: 'Leave Type' },
  {
    key: 'status',
    label: 'Status',
    render: (r) => <StatusPill color={statusColor(r.status)}>{r.status}</StatusPill>,
  },
];

interface Filters {
  name: string;
  department: string;
  grade: string;
  leaveType: string;
  duration: string;
  status: string;
}

const emptyFilters: Filters = { name: '', department: '', grade: '', leaveType: '', duration: '', status: '' };

export default function LeaveRecordPage() {
  const { draft, applied, setField, handleSearch, handleReset } = useFilters(emptyFilters);

  const gradeOptions = useMemo(() => (draft.department ? getGradeOptions(draft.department) : getAllGradeOptions()), [draft.department]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (applied.name && !r.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.department && r.department !== applied.department) return false;
      if (applied.grade && r.grade !== applied.grade) return false;
      if (applied.leaveType && r.leaveType !== applied.leaveType) return false;
      if (applied.status && r.status !== applied.status) return false;
      if (applied.duration) {
        const days = parseInt(r.duration, 10);
        if (applied.duration === '<= 7 Days' && days > 7) return false;
        if (applied.duration === '>= 7 Days' && days < 7) return false;
      }
      return true;
    });
  }, [applied]);

  const handleDepartmentChange = (v: string) => {
    setField('department', v);
    setField('grade', '');
  };

  return (
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Attendance" page="Leave Record" />

        <SearchPanel
          title="Filter Leave Record"
          subtitle="Filter employee leaves based on employee, duration, and leave type."
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <SearchTextField label="Employee Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
          <SearchSelectField label="Department" value={draft.department} onChange={handleDepartmentChange} options={departmentOptions} />
          <SearchSelectField label="Grade" value={draft.grade} onChange={(v) => setField('grade', v)} options={gradeOptions} />
          <SearchSelectField label="Leave Type" value={draft.leaveType} onChange={(v) => setField('leaveType', v)} options={leaveTypeOptions} />
          <SearchSelectField label="Duration" value={draft.duration} onChange={(v) => setField('duration', v)} options={durationOptions} />
          <SearchSelectField label="Status" value={draft.status} onChange={(v) => setField('status', v)} options={statusOptions} />
        </SearchPanel>

        <SectionCard title="Leave Record" scroll>
          <DataTable columns={columns} rows={filtered} defaultSortKey="name" emptyMessage="No leave records match your filters." />
        </SectionCard>
      </div>
  );
}
