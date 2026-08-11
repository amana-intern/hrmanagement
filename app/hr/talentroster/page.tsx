'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  PageTopBar,
  SectionCard,
  QuickSearchBox,
  DataTable,
  Button,
  TextField,
  SelectField,
  Modal,
  EmployeeDetailsModal,
  AssessmentBadge,
} from '../../components/ui';
import type { DataTableColumn, EmployeeDetails } from '../../components/ui';
import { DEPARTMENT_OPTIONS, getGradeOptions } from '@/app/utils/orgStructure';

const CONTRACT_TYPE_OPTIONS = ['Permanent', 'Contract'];

interface Employee extends EmployeeDetails {
  id: number;
  role?: string;
  dateOfBirth?: string;
}

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'Andi Wijaya',
    grade: 'Senior Associate',
    department: 'Education and HR',
    assessmentDone: true,
    email: 'andi.wijaya@amana.id',
    phone: '0812-1818-1818',
    certificates: [
      'Certificate of Graphic Design',
      'Certificate of Web Development',
      'Certificate of UX/UI Design',
      'Certificate of Data Science',
      'Certificate of Digital Marketing',
    ],
  },
  {
    id: 2,
    name: 'Sari Dewi',
    grade: 'Senior Analyst',
    department: 'Digital and Finance',
    assessmentDone: false,
    email: 'sari.dewi@amana.id',
    phone: '0813-4567-8901',
    certificates: ['Sertifikat Dasar'],
  },
  {
    id: 3,
    name: 'Budi Hartono',
    grade: 'Associate',
    department: 'Health and Wellbeing',
    assessmentDone: true,
    email: 'budi.hartono@amana.id',
    phone: '0814-5678-9012',
    certificates: [],
  },
  {
    id: 4,
    name: 'Citra Lestari',
    grade: 'Principal',
    department: 'Education and HR',
    assessmentDone: false,
    email: 'citra.lestari@amana.id',
    phone: '0815-6789-0123',
    certificates: ['Sertifikat Keahlian A', 'Sertifikat Keahlian B', 'TOEFL Certification', 'Leadership Cert', 'Advanced Analytics'],
  },
  {
    id: 5,
    name: 'Dimas Prayoga',
    grade: 'Analyst',
    department: 'Digital and Finance',
    assessmentDone: true,
    email: 'dimas.prayoga@amana.id',
    phone: '0816-7890-1234',
    certificates: ['PMP Certification', 'Agile Master'],
  },
  {
    id: 6,
    name: 'Eka Pratiwi',
    grade: 'Senior Analyst',
    department: 'Health and Wellbeing',
    assessmentDone: false,
    email: 'eka.pratiwi@amana.id',
    phone: '0817-8901-2345',
    certificates: ['Sertifikat Keahlian A', 'Sertifikat Keahlian B', 'TOEFL Certification', 'Leadership Cert'],
  },
];

let nextId = 7;

interface NewTalentValues {
  email: string;
  department: string;
  startDate: string;
  name: string;
  dateOfBirth: string;
  phone: string;
  grade: string;
  role: string;
  contractType: string;
  endDate: string;
}

const emptyTalentForm: NewTalentValues = {
  email: '',
  department: '',
  startDate: '',
  name: '',
  dateOfBirth: '',
  phone: '',
  grade: '',
  role: '',
  contractType: '',
  endDate: '',
};

function AddTalentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (values: NewTalentValues) => void }) {
  const [values, setValues] = useState<NewTalentValues>(emptyTalentForm);
  const gradeOptions = useMemo(() => getGradeOptions(values.department), [values.department]);

  const update = (field: keyof NewTalentValues) => (v: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: v };
      if (field === 'department') next.grade = '';
      if (field === 'contractType' && v !== 'Contract') next.endDate = '';
      return next;
    });
  };

  const invalid =
    !values.email ||
    !values.name ||
    !values.dateOfBirth ||
    !values.phone ||
    !values.department ||
    !values.grade ||
    !values.role ||
    !values.contractType ||
    !values.startDate ||
    (values.contractType === 'Contract' && !values.endDate);

  return (
    <Modal title="Add Talent" onClose={onClose} maxWidth="max-w-3xl" className="max-h-[90vh]">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <TextField label="Talent Email" value={values.email} onChange={update('email')} placeholder="name@amana.id" />
        <TextField label="Talent Name" value={values.name} onChange={update('name')} placeholder="Employee full name" />

        <TextField label="Date of Birth" type="date" value={values.dateOfBirth} onChange={update('dateOfBirth')} />
        <TextField label="Phone Number" value={values.phone} onChange={update('phone')} placeholder="08xx-xxxx-xxxx" />

        <SelectField label="Department" value={values.department} onChange={update('department')} options={DEPARTMENT_OPTIONS} />
        <SelectField
          label="Grade"
          value={values.grade}
          onChange={update('grade')}
          options={gradeOptions}
          disabled={!values.department}
          placeholder={values.department ? 'Select grade' : 'Select department first'}
        />

        <TextField label="Role" value={values.role} onChange={update('role')} placeholder="e.g. Finance" />
        <SelectField label="Contract Type" value={values.contractType} onChange={update('contractType')} options={CONTRACT_TYPE_OPTIONS} />

        <TextField label="Start Date" type="date" value={values.startDate} onChange={update('startDate')} />
        {values.contractType === 'Contract' && (
          <TextField label="End Date" type="date" value={values.endDate} onChange={update('endDate')} />
        )}
      </div>

      <div className="flex-shrink-0 flex justify-end px-5 py-4 border-t border-amana-neutral-200">
        <Button variant="primary" size="lg" disabled={invalid} onClick={() => onAdd(values)}>
          Add Talent
        </Button>
      </div>
    </Modal>
  );
}

export default function TalentRosterPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [addingTalent, setAddingTalent] = useState(false);

  const filtered = useMemo(() => {
    if (!appliedQuery) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(appliedQuery.toLowerCase()));
  }, [employees, appliedQuery]);

  const handleAddTalent = (values: NewTalentValues) => {
    setEmployees((prev) => [
      ...prev,
      {
        id: nextId++,
        name: values.name,
        grade: values.grade,
        department: values.department,
        role: values.role,
        dateOfBirth: values.dateOfBirth,
        assessmentDone: false,
        email: values.email,
        phone: values.phone,
        certificates: [],
      },
    ]);
    setAddingTalent(false);
  };

  const handleRemoveTalent = (id: number) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setSelectedEmployee(null);
  };

  const columns: DataTableColumn<Employee>[] = [
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'grade', label: 'Grade' },
    { key: 'assessmentDone', label: 'Assessment', render: (e) => <AssessmentBadge done={e.assessmentDone} fullWidth /> },
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

        <SectionCard
          title="Talent Roster"
          scroll
          action={
            <Button variant="primary" size="md" onClick={() => setAddingTalent(true)}>
              Add New Talent
            </Button>
          }
        >
          <DataTable columns={columns} rows={filtered} defaultSortKey="name" emptyMessage="No talent matches your search." />
        </SectionCard>
      </div>

      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDetailsModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onRemove={() => handleRemoveTalent(selectedEmployee.id)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addingTalent && <AddTalentModal onClose={() => setAddingTalent(false)} onAdd={handleAddTalent} />}
      </AnimatePresence>
    </>
  );
}
