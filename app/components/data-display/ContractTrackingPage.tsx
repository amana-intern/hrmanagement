'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

type FilterKey = 'all' | 'over90' | 'under90' | 'under60' | 'under30';

const FILTER_KEYS: readonly string[] = ['all', 'over90', 'under90', 'under60', 'under30'];

// Parse ?filter= dari URL (deep-link durasi). Link lama ?filter=needaction (notifikasi renewal/offboarding) jatuh ke 'all':
// tabel Need Action sekarang selalu tampil di atas tabel utama bila ada isinya.
function parseFilterParam(q: string | null): FilterKey {
  return q && FILTER_KEYS.includes(q) ? (q as FilterKey) : 'all';
}

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
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<FilterKey>(() => parseFilterParam(searchParams.get('filter')));

  // Sinkron saat query URL berubah: Next tidak me-remount halaman utk perubahan query,
  // jadi tanpa effect ini klik notifikasi saat sudah di halaman yang sama tak memindah filter.
  useEffect(() => {
    setActiveFilter(parseFilterParam(searchParams.get('filter')));
  }, [searchParams]);

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

  const filters = baseFilters;

  // Filter nama/PG/grade/tanggal berlaku untuk kedua tabel; filter durasi hanya untuk tabel utama.
  const matchesBase = (c: Contract) => {
    if (applied.name && !c.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
    if (applied.department && c.department !== applied.department) return false;
    if (applied.grade && c.grade !== applied.grade) return false;
    if (applied.signFrom && (!c.startDate || c.startDate < applied.signFrom)) return false;
    if (applied.signTo && (!c.startDate || c.startDate > applied.signTo)) return false;
    if (applied.endFrom && (!c.endDate || c.endDate < applied.endFrom)) return false;
    if (applied.endTo && (!c.endDate || c.endDate > applied.endTo)) return false;
    return true;
  };

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (!matchesBase(c)) return false;
      // Tanpa end date tidak ada sisa durasi: hanya tampil di "Show All".
      if (activeFilter !== 'all' && !c.endDate) return false;
      return matchesFilter(c.daysLeft, activeFilter);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, activeFilter, applied]);

  const needActionRows = useMemo(
    () => (needActionConfig ? contracts.filter((c) => c.needAction && matchesBase(c)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contracts, applied, needActionConfig]
  );

  // Kolom identitas kontrak — dipakai sama persis oleh tabel Need Action dan All Active Contract.
  const baseColumns: DataTableColumn<Contract>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Practice Group' },
    { key: 'grade', label: 'Grade' },
    ...(showStartDate
      ? [
          {
            key: 'startDate',
            label: 'Start Date',
            sortValue: (c: Contract) => (c.startDate ? new Date(c.startDate).getTime() : 0),
            render: (c: Contract) => (c.startDate ? formatDateWIB(c.startDate) : '-'),
          } as DataTableColumn<Contract>,
          {
            key: 'endDate',
            label: 'End Date',
            sortValue: (c: Contract) => (c.endDate ? new Date(c.endDate).getTime() : 0),
            render: (c: Contract) => (c.endDate ? formatDateWIB(c.endDate) : '-'),
          } as DataTableColumn<Contract>,
        ]
      : []),
  ];

  // Di tabel utama kontrak yang sudah ditandai Partner tampil sebagai pill "Need Action";
  // di tabel Need Action yang ditampilkan sisa durasi sebenarnya (keputusan Partner ada di kolom sendiri).
  const durationColumn = (markNeedAction: boolean): DataTableColumn<Contract> => ({
    key: 'daysLeft',
    label: 'Remaining Duration',
    width: '150px',
    render: (c) =>
      markNeedAction && c.needAction ? (
        <StatusPill color="bg-amana-warning-500">Need Action</StatusPill>
      ) : !c.endDate ? (
        <StatusPill color="bg-amana-neutral-400">No end date</StatusPill>
      ) : (
        <StatusPill color={durationColor(c.daysLeft)}>{formatDuration(c.daysLeft)}</StatusPill>
      ),
  });

  const needActionColumns: DataTableColumn<Contract>[] = [
    ...baseColumns,
    durationColumn(false),
    {
      key: 'needAction',
      label: 'Partner Decision',
      render: (c) => {
        const badge = needActionBadge(c.needAction);
        return badge ? <StatusPill color={badge.color}>{badge.label}</StatusPill> : <span>-</span>;
      },
    },
    ...(needActionConfig ? [needActionConfig.actionColumn] : []),
  ];

  const columns: DataTableColumn<Contract>[] = [
    ...baseColumns,
    durationColumn(true),
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
          value={activeFilter === 'all' ? '' : filters.find((f) => f.key === activeFilter)?.label ?? ''}
          onChange={(v) => setActiveFilter(filters.find((f) => f.label === v)?.key ?? 'all')}
          options={filters.filter((f) => f.key !== 'all').map((f) => f.label)}
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

      {needActionRows.length > 0 && (
        <SectionCard
          title="Need Action"
          subtitle={`${needActionRows.length} contract(s) awaiting HR follow-up`}
          scroll
          className="max-h-[340px] flex-shrink-0"
        >
          <DataTable columns={needActionColumns} rows={needActionRows} defaultSortKey="name" />
        </SectionCard>
      )}

      <SectionCard title="All Active Contract" scroll className="flex-1 min-h-[220px]">
        <DataTable
          columns={columns}
          rows={filtered}
          defaultSortKey="daysLeft"
          defaultSortDir="desc"
          emptyMessage="No contracts match this filter."
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
