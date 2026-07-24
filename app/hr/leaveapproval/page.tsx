'use client';

import { useState } from 'react';
import SidebarHR from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, PageTitle, Table, Badge, Button } from '../../components/ui';

interface LeaveRequest {
  id: number;
  name: string;
  grade: string;
  type: string;
  dates: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function LeaveApprovalPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([
    { id: 1, name: 'Ahmad Fauzi',  grade: 'Senior Analyst', type: 'Paid Leave',                dates: '25 Jul 2026 - 27 Jul 2026', status: 'Pending' },
    { id: 2, name: 'Sari Dewi',    grade: 'Associate',      type: 'Special Leave - Marriage',   dates: '28 Jul 2026 - 30 Jul 2026', status: 'Pending' },
    { id: 3, name: 'Budi Hartono', grade: 'Analyst',        type: 'Paid Leave',                dates: '01 Aug 2026 - 05 Aug 2026', status: 'Pending' },
    { id: 4, name: 'Citra Lestari',grade: 'Senior Analyst', type: 'Unpaid Leave',              dates: '10 Aug 2026',               status: 'Pending' },
  ]);

  const handleAction = (id: number, action: 'Approved' | 'Rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
  };

  const statusVariant = (s: string) =>
    s === 'Approved' ? 'approved' : s === 'Rejected' ? 'rejected' : 'pending';

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    { key: 'dates', label: 'Dates' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', align: 'center' as const },
  ];

  return (
    <PageLayout sidebar={<SidebarHR />}>
      <div className="animate-slide-up delay-100">
        <Table columns={columns}>
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-amana-blue/[0.03] transition-colors duration-200">
              <td className="p-4 font-semibold text-amana-black">{req.name}</td>
              <td className="p-4 text-amana-sec-7">{req.grade}</td>
              <td className="p-4 text-amana-black">{req.type}</td>
              <td className="p-4 text-amana-sec-7">{req.dates}</td>
              <td className="p-4"><Badge variant={statusVariant(req.status)}>{req.status}</Badge></td>
              <td className="p-4 text-center">
                <div className="min-w-[200px]">
                  {req.status === 'Pending' ? (
                    <div className="flex gap-2 justify-center">
                      <Button variant="primary" onClick={() => handleAction(req.id, 'Approved')}>Approve</Button>
                      <Button variant="secondary" onClick={() => handleAction(req.id, 'Rejected')}>Reject</Button>
                    </div>
                  ) : (
                    <span className="text-xs text-amana-sec-7 italic block text-center">Done</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </PageLayout>
  );
}
