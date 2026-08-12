'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageTopBar, SectionCard, QuickSearchBox, DataTable, Button, EmployeeDetailsModal, AssessmentBadge } from '../../components/ui';
import type { DataTableColumn, EmployeeDetails } from '../../components/ui';

interface Employee extends EmployeeDetails {
  id: number;
}

const employees: Employee[] = [
  {
    id: 1,
    name: 'Citra Lestari',
    grade: 'Analyst',
    department: 'Digital and Finance',
    assessmentDone: true,
    email: 'citra.lestari@amana.id',
    phone: '0812-1818-1818',
    certificates: ['Certificate of Graphic Design', 'Certificate of Web Development', 'Certificate of UX/UI Design', 'Certificate of Data Science', 'Certificate of Digital Marketing'],
  },
  {
    id: 2,
    name: 'Dimas Prayoga',
    grade: 'Senior Analyst',
    department: 'Digital and Finance',
    assessmentDone: false,
    email: 'dimas.prayoga@amana.id',
    phone: '0813-4567-8901',
    certificates: ['Sertifikat Dasar', 'PMP Certification', 'Agile Master'],
  },
  {
    id: 3,
    name: 'Eka Pratiwi',
    grade: 'Officer',
    department: 'Operations',
    assessmentDone: true,
    email: 'eka.pratiwi@amana.id',
    phone: '0814-5678-9012',
    certificates: ['Sertifikat Keahlian A', 'Sertifikat Keahlian B', 'TOEFL Certification', 'Leadership Cert', 'Advanced Analytics', 'Sertifikat Keahlian C'],
  },
  {
    id: 4,
    name: 'Fitri Handayani',
    grade: 'Senior Officer',
    department: 'Operations',
    assessmentDone: false,
    email: 'fitri.handayani@amana.id',
    phone: '0815-6789-0123',
    certificates: ['Sertifikat Keahlian A', 'Sertifikat Keahlian B', 'TOEFL Certification', 'Leadership Cert', 'Advanced Analytics', 'Sertifikat Keahlian C', 'Sertifikat Keahlian D'],
  },
];

export default function PartnerTalentRosterPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const filtered = useMemo(() => {
    if (!appliedQuery) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(appliedQuery.toLowerCase()));
  }, [appliedQuery]);

  const columns: DataTableColumn<Employee>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'grade', label: 'Grade' },
    { key: 'assessmentDone', label: 'Assessment', render: (e) => <AssessmentBadge done={e.assessmentDone} /> },
    { key: 'certificates', label: 'Certificate', render: (e) => `${e.certificates.length} Certification` },
    {
      key: 'id',
      label: 'Details',
      render: (e) => (
        <Button variant="primary" size="sm" className="w-full" onClick={() => setSelectedEmployee(e)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="w-full h-full flex flex-col gap-3">
        <PageTopBar showGreeting section="Career Hub" page="Talent Roster" />

        <QuickSearchBox
          title="Search Talent"
          subtitle="Search talent using integrated AMANA AI"
          query={query}
          onQueryChange={setQuery}
          onSearch={() => setAppliedQuery(query)}
          placeholder="Search by employee name..."
          open={searchOpen}
          onToggle={() => setSearchOpen((v) => !v)}
        />

        <SectionCard title="Talent Roster" scroll>
          <DataTable columns={columns} rows={filtered} defaultSortKey="name" emptyMessage="No talent matches your search." />
        </SectionCard>
      </div>

      <AnimatePresence>
        {selectedEmployee && <EmployeeDetailsModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
      </AnimatePresence>
    </>
  );
}
