'use client';

import { useMemo, useState } from 'react';
import PageTopBar from '../layout/PageTopBar';
import SectionCard from '../layout/SectionCard';
import DataTable from './DataTable';
import type { DataTableColumn } from './DataTable';
import ToggleButton from '../forms/ToggleButton';
import StatusPill from './StatusPill';
import Button from '../forms/Button';

function durationColor(daysLeft: number) {
  if (daysLeft > 90) return 'bg-amana-primary-500';
  if (daysLeft > 30) return 'bg-amana-warning-500';
  return 'bg-amana-danger-500';
}

export interface Contract {
  id: number | string;
  name: string;
  department: string;
  grade: string;
  daysLeft: number;
  startDate?: string;
  /** Partner's renewal/offboarding decision awaiting HR action, if any. */
  needAction?: string | null;
  needActionBy?: string | null;
}

type FilterKey = 'all' | 'needAction' | 'over90' | 'under90' | 'under60' | 'under30';

const baseFilters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Show All' },
  { key: 'over90', label: 'Over 90 Days' },
  { key: 'under90', label: 'Under 90 Days' },
  { key: 'under60', label: 'Under 60 Days' },
  { key: 'under30', label: 'Under 30 Days' },
];

const needActionLabel: Record<string, string> = { renewal: 'Renewal', offboarding: 'Offboarding' };
const needActionColor: Record<string, string> = { renewal: 'bg-amana-primary-500', offboarding: 'bg-amana-danger-500' };

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

interface ContractTrackingPageProps {
  contracts: Contract[];
  actionsColumn?: DataTableColumn<Contract>;
  /** Show the Start Date column (HR view). */
  showStartDate?: boolean;
  /** Show the "Need Action" filter tab + its dedicated table (HR only). */
  showNeedAction?: boolean;
  onExtend?: (c: Contract) => void;
  onDelete?: (c: Contract) => void;
}

export default function ContractTrackingPage({
  contracts,
  actionsColumn,
  showStartDate = false,
  showNeedAction = false,
  onExtend,
  onDelete,
}: ContractTrackingPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filters = showNeedAction
    ? [baseFilters[0], { key: 'needAction' as const, label: 'Need Action' }, ...baseFilters.slice(1)]
    : baseFilters;

  const isNeedAction = activeFilter === 'needAction';

  const filtered = useMemo(() => {
    if (isNeedAction) return contracts.filter((c) => !!c.needAction);
    return contracts.filter((c) => matchesFilter(c.daysLeft, activeFilter));
  }, [contracts, activeFilter, isNeedAction]);

  const columns: DataTableColumn<Contract>[] = isNeedAction
    ? [
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'grade', label: 'Grade' },
        {
          key: 'needAction',
          label: 'Partner Decision',
          width: '160px',
          render: (c) => (
            <StatusPill color={needActionColor[c.needAction ?? ''] ?? 'bg-amana-neutral-400'}>
              {needActionLabel[c.needAction ?? ''] ?? c.needAction}
            </StatusPill>
          ),
        },
        {
          key: 'id',
          label: 'Action',
          width: '160px',
          render: (c) =>
            c.needAction === 'offboarding' ? (
              <Button variant="danger" size="sm" className="w-full" onClick={() => onDelete?.(c)}>
                Delete
              </Button>
            ) : (
              <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => onExtend?.(c)}>
                Extend Contract
              </Button>
            ),
        },
      ]
    : [
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'grade', label: 'Grade' },
        ...(showStartDate
          ? [
              {
                key: 'startDate',
                label: 'Start Date',
                sortValue: (c: Contract) => (c.startDate ? new Date(c.startDate).getTime() : 0),
                render: (c: Contract) =>
                  c.startDate ? new Date(c.startDate + 'T00:00:00').toLocaleDateString('id-ID') : '-',
              } as DataTableColumn<Contract>,
            ]
          : []),
        {
          key: 'daysLeft',
          label: 'Remaining Duration',
          width: '150px',
          render: (c) => <StatusPill color={durationColor(c.daysLeft)}>{c.daysLeft} Day(s)</StatusPill>,
        },
        ...(actionsColumn ? [actionsColumn] : []),
      ];

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar showGreeting />

      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center gap-3 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
        <div className="flex-1">
          <h3 className="text-[20px] font-semibold text-amana-primary-500">Filter</h3>
          <p className="text-[13px] text-amana-neutral-400">Filter contracts based on remaining employment duration</p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <ToggleButton
              key={f.key}
              selected={activeFilter === f.key}
              onClick={() => setActiveFilter(f.key)}
              className="flex-1 min-w-0 whitespace-normal text-center px-2 py-1.5 text-[13px] leading-[1.15]"
            >
              {f.label}
            </ToggleButton>
          ))}
        </div>
      </div>

      <SectionCard title="All Active Contract" scroll>
        <DataTable
          key={activeFilter}
          columns={columns}
          rows={filtered}
          defaultSortKey={activeFilter === 'all' ? 'daysLeft' : 'name'}
          defaultSortDir={activeFilter === 'all' ? 'desc' : 'asc'}
          emptyMessage="No contracts match this filter."
        />
      </SectionCard>
    </div>
  );
}
