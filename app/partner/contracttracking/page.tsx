'use client';

import { ContractTrackingPage, Button } from '../../components/ui';
import type { Contract } from '../../components/data-display/ContractTrackingPage';

const contracts: Contract[] = [
  { id: 1, name: 'Citra Lestari', department: 'Digital and Finance', grade: 'Analyst', daysLeft: 23 },
  { id: 2, name: 'Dimas Prayoga', department: 'Digital and Finance', grade: 'Senior Analyst', daysLeft: 28 },
  { id: 3, name: 'Eka Pratiwi', department: 'Health and Wellbeing', grade: 'Associate', daysLeft: 44 },
  { id: 4, name: 'Fitri Handayani', department: 'Education and HR', grade: 'Senior Associate', daysLeft: 70 },
  { id: 5, name: 'Gilang Ramadhan', department: 'Digital and Finance', grade: 'Analyst', daysLeft: 352 },
  { id: 6, name: 'Agus Setiawan', department: 'Health and Wellbeing', grade: 'Associate', daysLeft: 180 },
  { id: 7, name: 'Budi Santoso', department: 'Operations', grade: 'Officer', daysLeft: 150 },
  { id: 8, name: 'Cahyo Nugroho', department: 'Education and HR', grade: 'Principal', daysLeft: 100 },
  { id: 9, name: 'Dewi Lestari', department: 'Education and HR', grade: 'Analyst', daysLeft: 85 },
  { id: 10, name: 'Edi Purnomo', department: 'Operations', grade: 'Senior Officer', daysLeft: 65 },
  { id: 11, name: 'Farhan Azis', department: 'Operations', grade: 'Officer', daysLeft: 55 },
  { id: 12, name: 'Gita Saraswati', department: 'Digital and Finance', grade: 'Senior Analyst', daysLeft: 35 },
];

export default function PartnerContractTrackingPage() {
  return (
    <ContractTrackingPage
      contracts={contracts}
      actionsColumn={{
        key: 'id',
        label: 'Actions',
        width: '280px',
        render: () => (
          <div className="flex gap-2">
            <Button variant="danger" size="sm" className="flex-1 whitespace-nowrap">Off-Boarding</Button>
            <Button variant="primary" size="sm" className="flex-1 whitespace-nowrap">Renewal</Button>
          </div>
        ),
      }}
    />
  );
}
