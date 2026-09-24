'use client';

import { useMemo, useState } from 'react';
import PageTopBar from '../layout/PageTopBar';
import SectionCard from '../layout/SectionCard';
import SearchPanel from './SearchPanel';
import { SearchTextField, SearchSelectField, SearchDateRangeCalendarField } from '../forms/SearchFields';
import DataTable from './DataTable';
import type { DataTableColumn } from './DataTable';
import StatusPill from './StatusPill';
import { formatDateWIB } from '@/app/utils/formatDate';
import { useFilters } from '@/app/utils/useFilters';

function durationColor(daysLeft: number) {
  if (daysLeft > 90) return 'bg-amana-primary-500';
  if (daysLeft > 30) return 'bg-amana-warning-500';
  return 'bg-amana-danger-500';
}

function formatDuration(daysLeft: number): string {
  if (daysLeft <= 365) return `${daysLeft} Day(s)`;
  const years = Math.floor(daysLeft / 365);
  const months = Math.floor((daysLeft % 365) / 30);
  return `${years}y ${months}m`;
}

export interface Contract {
  id: number | string;
  name: string;
  department: string;
  grade: string;
  daysLeft: number;
  startDate?: string;
  endDate?: string;
  needAction?: string | null; // 'RENEWAL' | 'OFFBOARDING' | null
  needActionBy?: string | null;
}

type FilterKey = 'all' | 'over90' | 'under90' | 'under60' | 'under30' | 'needaction';

const baseFilters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Show All' },
  { key: 'over90', label: 'Over 90 Days' },
  { key: 'under90', label: 'Under 90 Days' },
  { key: 'under60', label: 'Under 60 Days' },
  { key: 'under30', label: 'Under 30 Days' },
];

export interface NeedActionConfig {
  /** Kolom aksi (tombol Extend Contract / Delete Talent) untuk mode Need Action. */
  actionColumn: DataTableColumn<Contract>;
}

interface ContractTrackingPageProps {
  contracts: Contract[];
  actionsColumn?: DataTableColumn<Contract>;
  /** Show the Start Date column (HR view). */
  showStartDate?: boolean;
  /** Aktifkan filter "Need Action" (HR view) beserta kolom & badge decision partner. */
  needActionConfig?: NeedActionConfig;
}

export function needActionBadge(needAction?: string | null) {
  if (needAction === 'RENEWAL') return { label: 'Renewal', color: 'bg-amana-success-500' };
  if (needAction === 'OFFBOARDING') return { label: 'Offboarding', color: 'bg-amana-danger-500' };
  return null;
}

export default function ContractTrackingPage({
  contracts,
  actionsColumn,
  showStartDate = false,
  needActionConfig,
}: ContractTrackingPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const { draft, applied, setField, handleSearch, handleReset } = useFilters({
    name: '',
    department: '',
    grade: '',
    signFrom: '',
    signTo: '',
    endFrom: '',
    endTo: '',
  });

  const departmentOptions = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.department).filter((d) => d && d !== '-'))).sort(),
    [contracts]
  );
  const gradeOptions = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.grade).filter((g) => g && g !== '-'))).sort(),
    [contracts]
  );

  const filters = useMemo(
    () =>
      needActionConfig
        ? [...baseFilters, { key: 'needaction' as FilterKey, label: 'Need Action' }]
        : baseFilters,
    [needActionConfig]
  );

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (applied.name && !c.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.department && c.department !== applied.department) return false;
      if (applied.grade && c.grade !== applied.grade) return false;
      if (applied.signFrom && (!c.startDate || c.startDate < applied.signFrom)) return false;
      if (applied.signTo && (!c.startDate || c.startDate > applied.signTo)) return false;
      if (applied.endFrom && (!c.endDate || c.endDate < applied.endFrom)) return false;
      if (applied.endTo && (!c.endDate || c.endDate > applied.endTo)) return false;
      if (activeFilter === 'needaction') return !!c.needAction;
      return matchesFilter(c.daysLeft, activeFilter);
    });
  }, [contracts, activeFilter, applied]);

  const needActionColumns: DataTableColumn<Contract>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Practice Group' },
    { key: 'grade', label: 'Grade' },
    {
      key: 'needAction',
      label: 'Partner Decision',
      render: (c) => {
        const badge = needActionBadge(c.needAction);
        return badge ? (
          <StatusPill color={badge.color}>{badge.label}</StatusPill>
        ) : (
          <span>-</span>
        );
      },
    },
    ...(needActionConfig ? [needActionConfig.actionColumn] : []),
  ];

  const columns: DataTableColumn<Contract>[] =
    activeFilter === 'needaction'
      ? needActionColumns
      : [
          { key: 'name', label: 'Name' },
          { key: 'department', label: 'Practice Group' },
          { key: 'grade', label: 'Grade' },
          ...(showStartDate
            ? [
                {
                  key: 'startDate',
                  label: 'Start Date',
                  sortValue: (c: Contract) => (c.startDate ? new Date(c.startDate).getTime() : 0),
                  render: (c: Contract) =>
                    c.startDate ? formatDateWIB(c.startDate) : '-',
                } as DataTableColumn<Contract>,
                {
                  key: 'endDate',
                  label: 'End Date',
                  sortValue: (c: Contract) => (c.endDate ? new Date(c.endDate).getTime() : 0),
                  render: (c: Contract) =>
                    c.endDate ? formatDateWIB(c.endDate) : '-',
                } as DataTableColumn<Contract>,
              ]
            : []),
          {
            key: 'daysLeft',
            label: 'Remaining Duration',
            width: '150px',
            render: (c) =>
              c.needAction ? (
                <StatusPill color="bg-amana-warning-500">Need Action</StatusPill>
              ) : (
                <StatusPill color={durationColor(c.daysLeft)}>{formatDuration(c.daysLeft)}</StatusPill>
              ),
          },
          ...(actionsColumn ? [actionsColumn] : []),
        ];

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <SearchPanel
        title="Filter Contracts"
        subtitle="Filter employees based on name, department, grade, duration, sign date, or end date."
        onReset={handleReset}
        onSearch={handleSearch}
      >
        <SearchTextField label="Employee Name" value={draft.name} onChange={(v) => setField('name', v)} placeholder="Search by name..." />
        <SearchSelectField label="Practice Group" value={draft.department} onChange={(v) => setField('department', v)} options={departmentOptions} />
        <SearchSelectField label="Grade" value={draft.grade} onChange={(v) => setField('grade', v)} options={gradeOptions} />
        <SearchSelectField
          label="Remaining Duration"
          value={filters.find((f) => f.key === activeFilter)?.label ?? ''}
          onChange={(v) => setActiveFilter(filters.find((f) => f.label === v)?.key ?? 'all')}
          options={filters.map((f) => f.label)}
        />
        <SearchDateRangeCalendarField
          label="Contract Start Date"
          fromValue={draft.signFrom}
          toValue={draft.signTo}
          onFromChange={(v) => setField('signFrom', v)}
          onToChange={(v) => setField('signTo', v)}
        />
        <SearchDateRangeCalendarField
          label="Contract End Date"
          fromValue={draft.endFrom}
          toValue={draft.endTo}
          onFromChange={(v) => setField('endFrom', v)}
          onToChange={(v) => setField('endTo', v)}
        />
      </SearchPanel>

      <SectionCard
        title={activeFilter === 'needaction' ? 'Contracts Needing Action' : 'All Active Contract'}
        scroll
      >
        <DataTable
          key={activeFilter}
          columns={columns}
          rows={filtered}
          defaultSortKey="daysLeft"
          defaultSortDir="desc"
          emptyMessage={
            activeFilter === 'needaction'
              ? 'No contracts awaiting action.'
              : 'No contracts match this filter.'
          }
        />
      </SectionCard>
    </div>
  );
}

function matchesFilter(daysLeft: number, key: FilterKey) {
  switch (key) {
    case 'over90':
      return daysLeft > 90;
    case 'under90':
      return daysLeft <= 90 && daysLeft > 60;
    case 'under60':
      return daysLeft <= 60 && daysLeft > 30;
    case 'under30':
      return daysLeft <= 30;
    default:
      return true;
  }
}
