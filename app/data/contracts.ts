export interface Contract {
  id: number;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export const contracts: Contract[] = [
  { id: 1,  name: 'Citra Lestari',   role: 'Consultant',       startDate: '15 Aug 2023', endDate: '15 Aug 2026', daysLeft: 23 },
  { id: 2,  name: 'Dimas Prayoga',   role: 'Project Manager',  startDate: '20 Aug 2023', endDate: '20 Aug 2026', daysLeft: 28 },
  { id: 3,  name: 'Eka Pratiwi',     role: 'Lead',             startDate: '05 Sep 2023', endDate: '05 Sep 2026', daysLeft: 44 },
  { id: 4,  name: 'Fitri Handayani', role: 'Consultant',       startDate: '01 Oct 2023', endDate: '01 Oct 2026', daysLeft: 70 },
  { id: 5,  name: 'Gilang Ramadhan', role: 'Junior Consultant',startDate: '10 Jul 2024', endDate: '10 Jul 2027', daysLeft: 352 },
  { id: 6,  name: 'Agus Setiawan',   role: 'Lead',             startDate: '01 Jan 2024', endDate: '01 Jan 2027', daysLeft: 180 },
  { id: 7,  name: 'Budi Santoso',    role: 'Technical Lead',   startDate: '01 Feb 2024', endDate: '01 Feb 2027', daysLeft: 150 },
  { id: 8,  name: 'Cahyo Nugroho',   role: 'Designer',         startDate: '15 Mar 2024', endDate: '15 Mar 2027', daysLeft: 100 },
  { id: 9,  name: 'Dewi Lestari',    role: 'HR Specialist',    startDate: '01 Apr 2024', endDate: '01 Apr 2027', daysLeft: 85 },
  { id: 10, name: 'Edi Purnomo',     role: 'Technical Support',startDate: '15 May 2024', endDate: '15 May 2027', daysLeft: 65 },
  { id: 11, name: 'Farhan Azis',     role: 'Operations',       startDate: '01 Jun 2024', endDate: '01 Jun 2027', daysLeft: 55 },
  { id: 12, name: 'Gita Saraswati',  role: 'HR Specialist',    startDate: '15 Jun 2024', endDate: '15 Jun 2027', daysLeft: 35 },
];
