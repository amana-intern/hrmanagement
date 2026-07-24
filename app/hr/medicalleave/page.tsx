'use client';

import { useState } from 'react';
import SidebarHR from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, PageTitle, Card, CardSection, Table, Button } from '../../components/ui';

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
  ).sort((a, b) => b[1] - a[1]);

  const maxCount = chartData[0]?.[1] || 1;

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
            <div className="space-y-3">
              {chartData.map(([disease, count], i) => (
                <div key={disease} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-sm font-semibold text-amana-black w-24 truncate">{disease}</span>
                  <div className="flex-1 h-6 bg-amana-sec-6 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amana-blue to-amana-sec-3 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-amana-blue w-6 text-right">{count}</span>
                </div>
              ))}
              {chartData.length === 0 && (
                <p className="text-sm text-amana-sec-7 text-center py-4">No data available</p>
              )}
            </div>
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
