'use client';

import { useState } from 'react';
import SidebarHR from '../../components/navigation/SidebarHR/Sidebarhr';
import { PageLayout } from '../../components/layout';
import { Button } from '../../components/forms';
import { Card, CardSection } from '../../components/cards';
import { Table } from '../../components/tables';
import { HorizontalBarChart } from '../../components/charts';

interface MedicalLog {
  id: number;
  name: string;
  dates: string;
  diagnosis: string;
}

export default function MedicalLeavePage() {
  const [logs] = useState<MedicalLog[]>([
    { id: 1, name: 'Ahmad Fauzi', dates: '10 Jul 2026 - 12 Jul 2026', diagnosis: 'Fever' },
    { id: 2, name: 'Sari Dewi', dates: '15 Jul 2026 - 16 Jul 2026', diagnosis: 'Migraine' },
    { id: 3, name: 'Budi Hartono', dates: '20 Jul 2026 - 22 Jul 2026', diagnosis: 'Flu' },
  ]);

  const chartData = Object.entries(
    logs.reduce<Record<string, number>>((acc, l) => {
      acc[l.diagnosis] = (acc[l.diagnosis] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'dates', label: 'Dates' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'file', label: 'Document' },
  ];

  return (
    <PageLayout sidebar={<SidebarHR />}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in delay-100">
        <Card>
          <CardSection title="Disease Trends">
            <HorizontalBarChart data={chartData} />
          </CardSection>
        </Card>

        <Card>
          <div className="flex flex-col justify-between h-full">
            <CardSection title="Export Data">
              <p className="text-sm text-amana-sec-7 mb-4">
                Export sick leave data in CSV format for payroll processing.
              </p>
            </CardSection>
            <Button variant="primary" className="w-full">Export CSV</Button>
          </div>
        </Card>
      </div>

      <div className="animate-slide-up delay-200">
        <Table columns={columns}>
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-amana-blue/[0.03] transition-colors duration-200">
              <td className="p-4 font-semibold text-amana-black">{log.name}</td>
              <td className="p-4 text-amana-sec-7">{log.dates}</td>
              <td className="p-4 text-amana-black">{log.diagnosis}</td>
              <td className="p-4">
                <Button variant="ghost">View Document</Button>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </PageLayout>
  );
}
