'use client';

import { useMemo } from 'react';
import SidebarHR from '../../components/navigation/SidebarHR/Sidebarhr';
import { PageLayout } from '../../components/layout';
import { Button } from '../../components/forms';
import { Card } from '../../components/cards';
import { Table } from '../../components/tables';
import { ContractDaysBadge } from '../../components/feedback';
import { SectionLabel } from '../../components/layout';
import { contracts } from '../../data';

const sortDesc = (a: typeof contracts[0], b: typeof contracts[0]) => b.daysLeft - a.daysLeft;

const contractColumns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'start', label: 'Start Date' },
  { key: 'end', label: 'End Date' },
  { key: 'daysLeft', label: 'Days Left', align: 'center' as const },
  { key: 'action', label: 'Action', align: 'center' as const },
];

function RenderContractTable({ data }: { data: typeof contracts }) {
  return (
    <div className="mb-10 animate-slide-up delay-100">
      <Table columns={contractColumns}>
        {data.map((c) => (
          <tr key={c.id} className="border-b border-amana-sec-3">
            <td className="p-2 w-1/4 font-semibold text-amana-black">{c.name}</td>
            <td className="p-2 w-1/6 text-amana-sec-7">{c.role}</td>
            <td className="p-2 w-1/6 text-amana-black">{c.startDate}</td>
            <td className="p-2 w-1/6 text-amana-black">{c.endDate}</td>
            <td className="p-2 w-1/12 text-center whitespace-nowrap"><ContractDaysBadge days={c.daysLeft} /></td>
            <td className="p-2 w-1/6 text-center">
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" className="flex-1 px-3 py-1">Renewal</Button>
                <Button variant="danger" className="flex-1 px-3 py-1">Offboarding</Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

export default function ContractTrackingPage() {
  const contractsOver90 = useMemo(() => contracts.filter((c) => c.daysLeft > 90).sort(sortDesc), []);
  const contractsUnder90 = useMemo(() => contracts.filter((c) => c.daysLeft <= 90 && c.daysLeft > 60).sort(sortDesc), []);
  const contractsUnder60 = useMemo(() => contracts.filter((c) => c.daysLeft <= 60 && c.daysLeft > 30).sort(sortDesc), []);
  const contractsUnder30 = useMemo(() => contracts.filter((c) => c.daysLeft <= 30).sort(sortDesc), []);

  return (
    <PageLayout sidebar={<SidebarHR />}>
      <Card padding="lg">
        <SectionLabel>Over 90 Days</SectionLabel>
        <RenderContractTable data={contractsOver90} />

        <SectionLabel>Under 90 Days</SectionLabel>
        <RenderContractTable data={contractsUnder90} />

        <SectionLabel>Under 60 Days</SectionLabel>
        <RenderContractTable data={contractsUnder60} />

        <SectionLabel>Under 30 Days</SectionLabel>
        <RenderContractTable data={contractsUnder30} />
      </Card>
    </PageLayout>
  );
}
