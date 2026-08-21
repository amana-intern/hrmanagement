import { DEPARTMENT_LABEL } from '@/lib/roles';

// Opsi filter department memakai label penuh (bukan key), agar cocok dengan
// nilai department yang sudah di-map saat render di halaman cuti/sakit.
export const DEPARTMENT_OPTIONS = Object.values(DEPARTMENT_LABEL);

export type Department = (typeof DEPARTMENT_OPTIONS)[number];

const OPERATIONS_GRADES = ['Junior Officer', 'Officer', 'Senior Officer', 'Lead / Coordinator', 'Head'];

const PRACTICE_GROUP_GRADES = [
  'Analyst',
  'Senior Analyst',
  'Associate',
  'Senior Associate',
  'Specialist',
  'Senior Specialist',
  'Principal',
  'Partner',
];

export function getGradeOptions(department: string): string[] {
  return department === 'Operations' ? OPERATIONS_GRADES : PRACTICE_GROUP_GRADES;
}

/** Union of every grade across all departments, for filters where no department is selected yet. */
export function getAllGradeOptions(): string[] {
  return [...OPERATIONS_GRADES, ...PRACTICE_GROUP_GRADES];
}
