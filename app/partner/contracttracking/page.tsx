'use client';

import { useMemo } from 'react';
import SidebarPar from '../../components/Sidebar/SidebarPartner/Sidebarpartner';
import { PageLayout, PageTitle, Table, Badge } from '../../components/ui';

export default function SuperadminContractTrackingPage() {
  const contracts = [
    { name: 'Citra Lestari', role: 'Consultant',       endDate: '15 Aug 2026', daysLeft: 23 },
    { name: 'Dimas Prayoga', role: 'Project Manager',  endDate: '20 Aug 2026', daysLeft: 28 },
    { name: 'Eka Pratiwi',   role: 'Lead',             endDate: '05 Sep 2026', daysLeft: 44 },
    { name: 'Fitri Handayani',role: 'Consultant',       endDate: '01 Oct 2026', daysLeft: 70 },
    { name: 'Gilang Ramadhan',role: 'Junior Consultant',endDate: '10 Jul 2027', daysLeft: 352 },
    { name: 'Agus Setiawan', role: 'Lead',             endDate: '01 Jan 2027', daysLeft: 180 },
    { name: 'Budi Santoso',  role: 'Technical Lead',   endDate: '01 Feb 2027', daysLeft: 150 },
    { name: 'Cahyo Nugroho', role: 'Designer',         endDate: '15 Mar 2027', daysLeft: 100 },
    { name: 'Dewi Lestari',  role: 'HR Specialist',    endDate: '01 Apr 2027', daysLeft: 85 },
    { name: 'Edi Purnomo',   role: 'Technical Support',endDate: '15 May 2027', daysLeft: 65 },
    { name: 'Farhan Azis',   role: 'Operations',       endDate: '01 Jun 2027', daysLeft: 55 },
    { name: 'Gita Saraswati',role: 'HR Specialist',    endDate: '15 Jun 2027', daysLeft: 35 },
  ];

  const sortDesc = (a: typeof contracts[0], b: typeof contracts[0]) => b.daysLeft - a.daysLeft;

  const contractsOver90 = useMemo(() => contracts.filter((c) => c.daysLeft > 90).sort(sortDesc), [contracts]);
  const contractsUnder90 = useMemo(() => contracts.filter((c) => c.daysLeft <= 90 && c.daysLeft > 60).sort(sortDesc), [contracts]);
  const contractsUnder60 = useMemo(() => contracts.filter((c) => c.daysLeft <= 60 && c.daysLeft > 30).sort(sortDesc), [contracts]);
  const contractsUnder30 = useMemo(() => contracts.filter((c) => c.daysLeft <= 30).sort(sortDesc), [contracts]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'end', label: 'End Date' },
    { key: 'daysLeft', label: 'Days Left', align: 'center' as const },
  ];

  const daysBadge = (d: number) =>
    d > 90
      ? <Badge variant="success">{d} days</Badge>
      : d > 60
      ? <Badge variant="warning">{d} days</Badge>
      : d > 30
      ? <Badge variant="pending">{d} days</Badge>
      : <Badge variant="danger" pulse>{d} days</Badge>;

  const RenderTable = ({ data }: { data: typeof contracts }) => (
    <div className="mb-10 animate-slide-up delay-100">
      <Table columns={columns}>
        {data.map((c, i) => (
          <tr key={i} className="border-b border-amana-sec-3">
            <td className="p-2 w-1/4 font-semibold text-amana-black">{c.name}</td>
            <td className="p-2 w-1/4 text-amana-sec-7">{c.role}</td>
            <td className="p-2 w-1/4 text-amana-black">{c.endDate}</td>
            <td className="p-2 w-1/4 text-center whitespace-nowrap">{daysBadge(c.daysLeft)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );

  return (
    <PageLayout sidebar={<SidebarPar />}>

      <div className="p-10 border border-amana-sec-5 rounded-3xl bg-white shadow-lg">
        <div className="animate-fade-in mb-10">
        </div>

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Over 90 Days</span>
        </div>
        <RenderTable data={contractsOver90} />

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Under 90 Days</span>
        </div>
        <RenderTable data={contractsUnder90} />

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Under 60 Days</span>
        </div>
        <RenderTable data={contractsUnder60} />

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Under 30 Days</span>
        </div>
        <RenderTable data={contractsUnder30} />
      </div>
    </PageLayout>
  );
}