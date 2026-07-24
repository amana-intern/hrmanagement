'use client';

import { useState } from 'react';
import SidebarPar from '../../components/navigation/SidebarPartner/Sidebarpartner';
import { PageLayout } from '../../components/layout';
import { ApprovalTable, approvalStatusVariant } from '../../components/tables';
import { Badge } from '../../components/feedback';

interface LeaveRequest {
  id: number;
  name: string;
  grade: string;
  type: string;
  dates: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function SuperadminLeaveApprovalPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([
    { id: 1, name: 'Ahmad Fauzi', grade: 'Senior Analyst', type: 'Paid Leave', dates: '25 Jul 2026 - 27 Jul 2026', status: 'Pending' },
    { id: 2, name: 'Sari Dewi', grade: 'Associate', type: 'Special Leave - Marriage', dates: '28 Jul 2026 - 30 Jul 2026', status: 'Pending' },
    { id: 3, name: 'Budi Hartono', grade: 'Analyst', type: 'Paid Leave', dates: '01 Aug 2026 - 05 Aug 2026', status: 'Pending' },
  ]);

  const handleAction = (id: number, action: 'Approved' | 'Rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'type', label: 'Leave Type' },
    { key: 'dates', label: 'Dates' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <PageLayout sidebar={<SidebarPar />}>
      <div className="animate-slide-up delay-100">
        <ApprovalTable
          columns={columns}
          data={requests}
          pendingStatus="Pending"
          onApprove={(id) => handleAction(id as number, 'Approved')}
          onReject={(id) => handleAction(id as number, 'Rejected')}
          renderRow={(req) => [
            <span key="name" className="font-semibold text-amana-black">{req.name}</span>,
            <span key="grade" className="text-amana-sec-7">{req.grade}</span>,
            <span key="type" className="text-amana-black">{req.type}</span>,
            <span key="dates" className="text-amana-sec-7">{req.dates}</span>,
            <Badge key="status" variant={approvalStatusVariant(req.status)}>{req.status}</Badge>,
          ]}
        />
      </div>
    </PageLayout>
  );
}
