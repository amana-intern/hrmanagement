'use client';

import { useEffect, useState } from 'react';
import ContractTrackingPage from '@/app/components/data-display/ContractTrackingPage';
import type { Contract } from '@/app/components/data-display/ContractTrackingPage';
import { TableSkeleton } from '@/app/components/feedback/PageSkeleton';

interface ServerContract {
  idKaryawan: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  tipeKontrak: string | null;
  startDate: string | null;
  endDate: string | null;
  daysLeft: number | null;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  health: 'Health & Wellbeing',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

export default function HRContractTrackingPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/hr/contracts', { cache: 'no-store' });
      if (res.ok) {
        const body = (await res.json()) as { list?: ServerContract[] };
        setContracts(
          (body.list ?? []).map((c) => {
            const dept = (c.department && DEPARTMENT_LABELS[c.department]) || c.department || '-';
            return {
              id: c.idKaryawan,
              name: c.nama ?? '-',
              department: dept,
              grade: c.grade ?? '-',
              daysLeft: c.daysLeft ?? 0,
              startDate: c.startDate ? c.startDate.slice(0, 10) : '',
            };
          })
        );
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <TableSkeleton columns={5} />;

  return <ContractTrackingPage contracts={contracts} showStartDate />;
}