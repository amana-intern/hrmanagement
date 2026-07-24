"use client";

import { useMemo } from 'react';
import SidebarHR from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, PageTitle, Table, Button, Badge } from '../../components/ui';

interface Contract {
  id: number;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export default function ContractTrackingPage() {
  const contracts: Contract[] = [
    { id: 1,  name: 'Citra Lestari',   role: 'Consultant',       startDate: '15 Aug 2023', endDate: '15 Aug 2026', daysLeft: 23 },
    { id: 2,  name: 'Dimas Prayoga',   role: 'Project Manager',  startDate: '20 Aug 2023', endDate: '20 Aug 2026', daysLeft: 28 },
    { id: 3,  name: 'Eka Pratiwi',     role: 'Lead',             startDate: '05 Sep 2023', endDate: '05 Sep 2026', daysLeft: 44 },
    { id: 4,  name: 'Fitri Handayani', role: 'Consultant',       startDate: '01 Oct 2023', endDate: '01 Oct 2026', daysLeft: 70 },
    { id: 5,  name: 'Gilang Ramadhan', role: 'Junior Consultant',startDate: '10 Jul 2024', endDate: '10 Jul 2027', daysLeft: 352 },
    { id: 6,  name: 'Agus Setiawan',   role: 'Lead',             startDate: '01 Jan 2024', endDate: '01 Jan 2027', daysLeft: 180 },
    { id: 7,  name: 'Budi Santoso',    role: 'Technical Lead',   startDate: '01 Feb 2024', endDate: '01 Feb 2027', daysLeft: 150 },
    { id: 8,  name: 'Cahyo Nugroho',   role: 'Designer',         startDate: '15 Mar 2024', endDate: '15 Mar 2027', daysLeft: 100 },
    { id: 9,  name: 'Dewi Lestari',    role: 'HR Specialist',    startDate: '01 Apr 2024', endDate: '01 Apr 2027', daysLeft: 85 },
    { id: 10, name: 'Edi Purnomo',     role: 'Technical Support',startDate: '15 May 2024', endDate: '15 May 2027', daysLeft: 65 },
    { id: 11, name: 'Farhan Azis',     role: 'Operations',       startDate: '01 Jun 2024', endDate: '01 Jun 2027', daysLeft: 55 },
    { id: 12, name: 'Gita Saraswati',  role: 'HR Specialist',    startDate: '15 Jun 2024', endDate: '15 Jun 2027', daysLeft: 35 },
  ];

  const sortDesc = (a: Contract, b: Contract) => b.daysLeft - a.daysLeft;

  const contractsOver90 = useMemo(() => contracts.filter((c) => c.daysLeft > 90).sort(sortDesc), [contracts]);
  const contractsUnder90 = useMemo(() => contracts.filter((c) => c.daysLeft <= 90 && c.daysLeft > 60).sort(sortDesc), [contracts]);
  const contractsUnder60 = useMemo(() => contracts.filter((c) => c.daysLeft <= 60 && c.daysLeft > 30).sort(sortDesc), [contracts]);
  const contractsUnder30 = useMemo(() => contracts.filter((c) => c.daysLeft <= 30).sort(sortDesc), [contracts]);

  const contractColumns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'start', label: 'Start Date' },
    { key: 'end', label: 'End Date' },
    { key: 'daysLeft', label: 'Days Left', align: 'center' as const },
    { key: 'action', label: 'Action', align: 'center' as const },
  ];

  const RenderContractTable = ({ data }: { data: Contract[] }) => (
    <div className="mb-10 animate-slide-up delay-100">
      <Table columns={contractColumns}>
        {data.map((c) => (
          <tr key={c.id} className="border-b border-amana-sec-3">
            <td className="p-2 w-1/4 font-semibold text-amana-black">{c.name}</td>
            <td className="p-2 w-1/6 text-amana-sec-7">{c.role}</td>
            <td className="p-2 w-1/6 text-amana-black">{c.startDate}</td>
            <td className="p-2 w-1/6 text-amana-black">{c.endDate}</td>
            <td className="p-2 w-1/12 text-center whitespace-nowrap">
                {c.daysLeft > 90 ? (
                  <Badge variant="success">{c.daysLeft} days</Badge>
                ) : c.daysLeft > 60 ? (
                  <Badge variant="warning">{c.daysLeft} days</Badge>
                ) : c.daysLeft > 30 ? (
                  <Badge variant="pending">{c.daysLeft} days</Badge>
                ) : (
                  <Badge variant="danger" pulse>{c.daysLeft} days</Badge>
                )}
              </td>
            <td className="p-2 w-1/6 text-center">
              <div className="flex gap-1 justify-center">
                <Button variant="secondary" className="px-3 py-1">Renewal</Button>
                <Button variant="secondary" className="px-3 py-1 border-rose-500 text-rose-600 hover:bg-rose-50 hover:shadow-rose-200/50">Offboarding</Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );

  return (
    <PageLayout sidebar={<SidebarHR />}>
      
      <div className="p-10 border border-amana-sec-5 rounded-3xl bg-white shadow-lg">
        <div className="animate-fade-in mb-10">
        </div>

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Over 90 Days</span>
        </div>
        <RenderContractTable data={contractsOver90} />

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Under 90 Days</span>
        </div>
        <RenderContractTable data={contractsUnder90} />

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Under 60 Days</span>
        </div>
        <RenderContractTable data={contractsUnder60} />

        <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
          <span className="border-b border-amana-black px-1 pb-1">Under 30 Days</span>
        </div>
        <RenderContractTable data={contractsUnder30} />
      </div>

    </PageLayout>
  );
}