'use client';

import { useMemo, useState } from 'react';
import { PageTopBar, SearchPanel, SearchTextField, SearchSelectField, SectionCard, DataTable, Button } from '../../components/ui';
import type { DataTableColumn } from '../../components/ui';
import { DEPARTMENT_OPTIONS, getGradeOptions, getAllGradeOptions } from '@/app/utils/orgStructure';

interface SickRecord {
  id: number;
  name: string;
  department: string;
  grade: string;
  submitted: string;
  duration: string;
  sicknessType: string;
}

const sickRecords: SickRecord[] = [
  { id: 1, name: 'Ahmad Fauzi', department: 'Digital and Finance', grade: 'Analyst', submitted: '11 August 2026', duration: '1 Day(s)', sicknessType: 'Flu' },
  { id: 2, name: 'Sari Dewi', department: 'Digital and Finance', grade: 'Senior Analyst', submitted: '1 August 2026', duration: '3 Day(s)', sicknessType: 'Asma' },
  { id: 3, name: 'Budi Hartono', department: 'Health and Wellbeing', grade: 'Associate', submitted: '31 October 2026', duration: '1 Day(s)', sicknessType: 'Covid' },
  { id: 4, name: 'Citra Lestari', department: 'Education and HR', grade: 'Senior Associate', submitted: '5 October 2026', duration: '4 Day(s)', sicknessType: 'Flu' },
  { id: 5, name: 'Dedi Prasetyo', department: 'Digital and Finance', grade: 'Analyst', submitted: '11 August 2026', duration: '1 Day(s)', sicknessType: 'Fever' },
  { id: 6, name: 'Eka Nurhayati', department: 'Digital and Finance', grade: 'Senior Analyst', submitted: '1 August 2026', duration: '2 Day(s)', sicknessType: 'Flu' },
];

const sicknessTypeOptions = ['Flu', 'Asma', 'Covid', 'Fever'];
const departmentOptions = DEPARTMENT_OPTIONS;
const durationOptions = ['<= 7 Days', '>= 7 Days'];

const diseaseBarColor = 'bg-amana-danger-400';

function DocumentButton() {
  return (
    <Button variant="primary" size="sm" className="w-full">
      View
    </Button>
  );
}

const columns: DataTableColumn<SickRecord>[] = [
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'grade', label: 'Grade' },
  { key: 'submitted', label: 'Submitted', sortValue: (r) => new Date(r.submitted).getTime() },
  { key: 'duration', label: 'Duration', sortValue: (r) => parseInt(r.duration, 10) },
  { key: 'sicknessType', label: 'Sickness Type' },
  { key: 'id', label: 'Document', render: () => <DocumentButton /> },
];

interface Filters {
  name: string;
  department: string;
  grade: string;
  sicknessType: string;
  duration: string;
}

const emptyFilters: Filters = { name: '', department: '', grade: '', sicknessType: '', duration: '' };

export default function MedicalLeaveRecordPage() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');
  const [sicknessType, setSicknessType] = useState('');
  const [duration, setDuration] = useState('');

  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);

  const gradeOptions = useMemo(() => (department ? getGradeOptions(department) : getAllGradeOptions()), [department]);

  const filtered = useMemo(() => {
    return sickRecords.filter((r) => {
      if (appliedFilters.name && !r.name.toLowerCase().includes(appliedFilters.name.toLowerCase())) return false;
      if (appliedFilters.department && r.department !== appliedFilters.department) return false;
      if (appliedFilters.grade && r.grade !== appliedFilters.grade) return false;
      if (appliedFilters.sicknessType && r.sicknessType !== appliedFilters.sicknessType) return false;
      if (appliedFilters.duration) {
        const days = parseInt(r.duration, 10);
        if (appliedFilters.duration === '<= 7 Days' && days > 7) return false;
        if (appliedFilters.duration === '>= 7 Days' && days < 7) return false;
      }
      return true;
    });
  }, [appliedFilters]);

  const diseaseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sickRecords.forEach((r) => counts.set(r.sicknessType, (counts.get(r.sicknessType) || 0) + 1));
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;
    return entries.map(([disease, count]) => ({ disease, count, pct: (count / max) * 100 }));
  }, []);

  const handleSearch = () => {
    setAppliedFilters({ name, department, grade, sicknessType, duration });
  };

  const handleReset = () => {
    setName('');
    setDepartment('');
    setGrade('');
    setSicknessType('');
    setDuration('');
    setAppliedFilters(emptyFilters);
  };

  const handleDepartmentChange = (v: string) => {
    setDepartment(v);
    setGrade('');
  };

  return (
      <div className="w-full min-h-full flex flex-col gap-3 pb-2 md:pb-3 lg:pb-4">
        <PageTopBar showGreeting section="Attendance" page="Medical Leave Record" />

        <SearchPanel
          title="Filter Leave Record"
          subtitle="Filter employee leaves based on employee, sickness, duration"
          onReset={handleReset}
          onSearch={handleSearch}
        >
          <SearchTextField label="Employee Name" value={name} onChange={setName} placeholder="Search by name..." />
          <SearchSelectField label="Department" value={department} onChange={handleDepartmentChange} options={departmentOptions} />
          <SearchSelectField label="Grade" value={grade} onChange={setGrade} options={gradeOptions} />
          <SearchSelectField label="Sickness Type" value={sicknessType} onChange={setSicknessType} options={sicknessTypeOptions} />
          <SearchSelectField label="Duration" value={duration} onChange={setDuration} options={durationOptions} />
        </SearchPanel>

        <SectionCard title="Sick Leave Record" scroll className="max-h-[700px]">
          <DataTable columns={columns} rows={filtered} defaultSortKey="name" emptyMessage="No sick leave records match your filters." />
        </SectionCard>

        <SectionCard title="Frequent Diseases" scroll className="flex-shrink-0 h-[260px]">
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col justify-center gap-3 py-2 pr-2">
            {diseaseCounts.map(({ disease, count, pct }) => (
              <div key={disease} className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-amana-neutral-500 w-16 flex-shrink-0 truncate">{disease}</span>
                <div className="flex-1 h-4 bg-amana-neutral-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${diseaseBarColor}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[16px] font-semibold text-amana-neutral-500 w-5 text-right flex-shrink-0">{count}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 flex-shrink-0">
            <Button variant="primary" size="md">
              Export
            </Button>
          </div>
        </SectionCard>
      </div>
  );
}
