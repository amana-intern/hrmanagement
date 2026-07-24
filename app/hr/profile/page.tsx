'use client';

import { useState } from 'react';
import SidebarPar from '../../components/Sidebar/SidebarHR/Sidebarhr';
import { PageLayout, Table, Modal, Button, Badge, StatCard } from '../../components/ui';

// Mock Data
const employees = [
  {
    id: 1,
    name: 'Budi Santoso',
    grade: 'Senior',
    role: 'Software Engineer',
    assessment: 'Excellent',
    certificate: 'AWS Certified',
    phone: '+62 812 3456 7890',
    email: 'budi.santoso@example.com',
    birthDate: '1990-05-15',
  },
  {
    id: 2,
    name: 'Siti Aminah',
    grade: 'Mid-Level',
    role: 'Product Manager',
    assessment: 'Good',
    certificate: 'PMP',
    phone: '+62 856 7890 1234',
    email: 'siti.aminah@example.com',
    birthDate: '1992-08-22',
  },
  {
    id: 3,
    name: 'Andi Wijaya',
    grade: 'Junior',
    role: 'QA Tester',
    assessment: 'Needs Improvement',
    certificate: 'ISTQB Foundation',
    phone: '+62 878 1234 5678',
    email: 'andi.wijaya@example.com',
    birthDate: '1995-12-10',
  }
];

export default function SuperadminProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'role', label: 'Role' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'certificate', label: 'Certificate' },
    { key: 'details', label: 'Details', align: 'center' as const },
  ];

  const openModal = (employee: typeof employees[0]) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(false);
  };

  return (
    <PageLayout sidebar={<SidebarPar />}>
      <div className="bg-white border border-amana-sec-6 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Header & Info Partner */}
        <div className="flex flex-col sm:flex-row gap-6 items-stretch">
          
          {/* Box Profile Image (Ratio 4:5) */}
          <div className="w-40 aspect-[4/5] bg-amana-sec-2/10 border border-amana-sec-6 rounded-2xl flex-shrink-0 overflow-hidden">
            <img 
              src="/PlaceHolderPP.png" 
              alt="Profile Picture" 
              className="w-full h-full object-cover" 
            />
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amana-blue tracking-tight">Hello, HR!</h1>
            <div className="bg-white border border-amana-sec-6 rounded-xl p-4 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-amana-blue">Human Resources Department</h2>
              <p className="text-base font-medium text-amana-sec-7">Human Resources</p>
            </div>
          </div>
        </div>

        {/* Section Summary */}
        <div className="border border-amana-sec-6 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-amana-blue">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-amana-sec-2/10 border border-amana-sec-6 rounded-xl min-h-[120px] flex items-center justify-center p-4 text-xs font-medium text-amana-sec-7 text-center">
              Visual / Graphic
            </div>
            <StatCard value={5} label="Leave Request" color="text-amana-blue" />
            <StatCard value={3} label="Sick Leaves" color="text-amber-500" />
            <StatCard value={35} label="Roster Data" color="text-emerald-600" />
            <StatCard value={3} label="Expiring Contracts (T-30)" color="text-rose-600" />
          </div>
        </div>

      </div>
    </PageLayout>
  );
}