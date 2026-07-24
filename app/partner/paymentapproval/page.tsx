'use client';

import { useState } from 'react';
import SidebarPar from '../../components/Sidebar/SidebarPartner/Sidebarpartner';
import { PageLayout, PageTitle, Table, Badge, Button } from '../../components/ui';

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

  const statusVariant = (s: string) =>
    s === 'Approved' ? 'approved' : s === 'Rejected' ? 'rejected' : 'pending';

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Requester' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', align: 'center' as const },
  ];

  return (
    <PageLayout sidebar={<SidebarPar />}>
      <div className="animate-slide-up delay-100">
        <Table columns={columns}>
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-amana-blue/[0.03] transition-colors duration-200">
              <td className="p-4 font-semibold text-amana-blue">{req.id}</td>
              <td className="p-4 text-amana-black">{req.user}</td>
              <td className="p-4 text-amana-sec-7">{req.type}</td>
              <td className="p-4 font-semibold text-amana-black">{req.amount}</td>
              <td className="p-4 text-amana-sec-7">{req.date}</td>
              <td className="p-4"><Badge variant={statusVariant(req.status)}>{req.status}</Badge></td>
              <td className="p-4 text-center">
                <div className="min-w-[200px]">
                  {req.status === 'Pending Partner' ? (
                    <div className="flex gap-2 justify-center">
                      <Button variant="primary" onClick={() => handleAction(req.id, 'Approved')}>Approve</Button>
                      <Button variant="secondary" onClick={() => handleAction(req.id, 'Rejected')}>Reject</Button>
                    </div>
                  ) : (
                    <span className="text-xs text-amana-sec-7 italic block text-center">-</span>
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
