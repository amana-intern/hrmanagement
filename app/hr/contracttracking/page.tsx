import { ContractTrackingPage } from '../../components/ui';
import type { Contract } from '../../components/data-display/ContractTrackingPage';

const contracts: Contract[] = [
  { id: 1, name: 'Citra Lestari', department: 'Digital and Finance', grade: 'Analyst', daysLeft: 23 },
  { id: 2, name: 'Dimas Prayoga', department: 'Digital and Finance', grade: 'Senior Analyst', daysLeft: 28 },
  { id: 3, name: 'Eka Pratiwi', department: 'Operations', grade: 'Officer', daysLeft: 44 },
  { id: 4, name: 'Fitri Handayani', department: 'Operations', grade: 'Senior Officer', daysLeft: 70 },
  { id: 5, name: 'Gilang Ramadhan', department: 'Digital and Finance', grade: 'Analyst', daysLeft: 352 },
  { id: 6, name: 'Agus Setiawan', department: 'Digital and Finance', grade: 'Senior Analyst', daysLeft: 180 },
  { id: 7, name: 'Budi Santoso', department: 'Operations', grade: 'Officer', daysLeft: 150 },
  { id: 8, name: 'Cahyo Nugroho', department: 'Operations', grade: 'Senior Officer', daysLeft: 100 },
  { id: 9, name: 'Dewi Lestari', department: 'Education and HR', grade: 'Analyst', daysLeft: 85 },
  { id: 10, name: 'Edi Purnomo', department: 'Health and Wellbeing', grade: 'Senior Analyst', daysLeft: 55 },
];

export default function HRContractTrackingPage() {
  return <ContractTrackingPage contracts={contracts} />;
}
