'use client';

import { useState } from 'react';
import SidebarPar from '../../components/navigation/SidebarPartner/Sidebarpartner';
import { PageLayout } from '../../components/layout';
import { ApprovalTable, approvalStatusVariant } from '../../components/tables';
import { Badge } from '../../components/feedback';

interface PaymentRequest {
  id: string;
  user: string;
  type: string;
  amount: string;
  date: string;
  status: 'Pending Partner' | 'Approved' | 'Rejected';
}

export default function SuperadminPaymentApprovalPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([
    { id: 'REQ-003', user: 'Budi Hartono',  type: 'Per Diem',   amount: 'Rp 8.000.000',  date: '20 Jul 2026', status: 'Pending Partner' },
    { id: 'REQ-005', user: 'Dimas Prayoga', type: 'Individual', amount: 'Rp 2.000.000',  date: '18 Jul 2026', status: 'Pending Partner' },
  ]);

  const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Requester' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <PageLayout sidebar={<SidebarPar />}>
      <div className="animate-slide-up delay-100">
        <ApprovalTable
          columns={columns}
          data={requests}
          pendingStatus="Pending Partner"
          doneLabel="-"
          onApprove={(id) => handleAction(id as string, 'Approved')}
          onReject={(id) => handleAction(id as string, 'Rejected')}
          renderRow={(req) => [
            <span key="id" className="font-semibold text-amana-blue">{req.id}</span>,
            <span key="user" className="text-amana-black">{req.user}</span>,
            <span key="type" className="text-amana-sec-7">{req.type}</span>,
            <span key="amount" className="font-semibold text-amana-black">{req.amount}</span>,
            <span key="date" className="text-amana-sec-7">{req.date}</span>,
            <Badge key="status" variant={approvalStatusVariant(req.status)}>{req.status}</Badge>,
          ]}
        />
      </div>
    </PageLayout>
  );
}
