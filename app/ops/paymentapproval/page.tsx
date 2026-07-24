'use client';

import { useState } from 'react';
import SidebarOPS from '../../components/navigation/SidebarOPS/Sidebarops';
import { PageLayout } from '../../components/layout';
import { ApprovalTable, approvalStatusVariant } from '../../components/tables';
import { Badge } from '../../components/feedback';

interface PaymentRequest {
  id: string;
  user: string;
  type: string;
  amount: string;
  date: string;
  status: string;
}

export default function PaymentApprovalPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([
    { id: 'REQ-001', user: 'Ahmad Fauzi',   type: 'Vendor',     amount: 'Rp 15.000.000', date: '22 Jul 2026', status: 'Pending Ops' },
    { id: 'REQ-002', user: 'Sari Dewi',     type: 'Individual', amount: 'Rp 3.500.000',  date: '21 Jul 2026', status: 'Pending Ops' },
    { id: 'REQ-003', user: 'Budi Hartono',  type: 'Per Diem',   amount: 'Rp 8.000.000',  date: '20 Jul 2026', status: 'Pending Partner' },
    { id: 'REQ-004', user: 'Citra Lestari', type: 'Vendor',     amount: 'Rp 22.000.000', date: '19 Jul 2026', status: 'Pending Ops' },
    { id: 'REQ-005', user: 'Dimas Prayoga', type: 'Individual', amount: 'Rp 2.000.000',  date: '18 Jul 2026', status: 'Pending Partner' },
  ]);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: action === 'approved' ? 'Pending Partner' : 'Rejected' } : req
      )
    );
  };

  const statusVariant = (s: string) =>
    s === 'Pending Ops' ? 'pending' : s === 'Pending Partner' ? 'info' : approvalStatusVariant(s);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Requester' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <PageLayout sidebar={<SidebarOPS />}>
      <div className="animate-slide-up delay-100">
        <ApprovalTable
          columns={columns}
          data={requests}
          pendingStatus="Pending Ops"
          doneLabel="-"
          onApprove={(id) => handleAction(id as string, 'approved')}
          onReject={(id) => handleAction(id as string, 'rejected')}
          renderRow={(req) => [
            <span key="id" className="font-semibold text-amana-blue">{req.id}</span>,
            <span key="user" className="text-amana-black">{req.user}</span>,
            <span key="type" className="text-amana-sec-7">{req.type}</span>,
            <span key="amount" className="font-semibold text-amana-black">{req.amount}</span>,
            <span key="date" className="text-amana-sec-7">{req.date}</span>,
            <Badge key="status" variant={statusVariant(req.status) as any}>{req.status}</Badge>,
          ]}
        />
      </div>
    </PageLayout>
  );
}
