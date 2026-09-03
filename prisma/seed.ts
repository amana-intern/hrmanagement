import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ASSESSMENT_FIELDS } from '../lib/assessment-template';

const prisma = new PrismaClient();

const ROLES = {
  EMPLOYEE: 'ROLE_EMPLOYEE',
  PARTNER: 'ROLE_PARTNER',
  ADMIN_HR: 'ROLE_ADMIN_HR',
  ADMIN_OPS: 'ROLE_ADMIN_OPS',
};

const PERMISSIONS: { id: string; namaAction: string }[] = [
  // Employee
  { id: 'leave:create', namaAction: 'Create leave request' },
  { id: 'medical:create', namaAction: 'Create medical/sick leave' },
  { id: 'payment:create', namaAction: 'Create payment request' },
  { id: 'cv:update', namaAction: 'Update CV' },
  { id: 'profile:view_own', namaAction: 'View own profile' },

  // Partner
  { id: 'leave:approve', namaAction: 'Approve/reject leave' },
  { id: 'leave:notify', namaAction: 'Receive leave notification' },
  { id: 'contract:view_expiry', namaAction: 'View contract expiry' },
  { id: 'payment:final_approve', namaAction: 'Final payment approval' },

  // Admin HR
  { id: 'contract:manage', namaAction: 'Manage contracts (renew/offboard)' },
  { id: 'medical:review', namaAction: 'Review medical leave' },
  { id: 'medical:export_csv', namaAction: 'Export attendance CSV' },
  { id: 'career:cms', namaAction: 'Manage job listings' },
  { id: 'talent:review', namaAction: 'Review talent roster' },
  { id: 'account:manage', namaAction: 'Activate/deactivate accounts' },

  // Admin OPS
  { id: 'payment:review_approve', namaAction: 'Review & approve payment (level 1)' },
  { id: 'payment:schedule', namaAction: 'Schedule & pay payment' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.EMPLOYEE]: [
    'leave:create',
    'medical:create',
    'payment:create',
    'cv:update',
    'profile:view_own',
  ],
  [ROLES.PARTNER]: [
    'profile:view_own',
    'leave:create',
    'medical:create',
    'leave:approve',
    'leave:notify',
    'contract:view_expiry',
    'payment:final_approve',
  ],
  [ROLES.ADMIN_HR]: [
    'profile:view_own',
    'contract:view_expiry',
    'contract:manage',
    'medical:review',
    'medical:export_csv',
    'career:cms',
    'talent:review',
    'account:manage',
  ],
  [ROLES.ADMIN_OPS]: [
    'profile:view_own',
    'payment:review_approve',
    'payment:schedule',
  ],
};

const GRADES = [
  { idGrade: 'GRD001', namaGrade: 'Analyst' },
  { idGrade: 'GRD002', namaGrade: 'Senior Analyst' },
  { idGrade: 'GRD003', namaGrade: 'Associate' },
  { idGrade: 'GRD004', namaGrade: 'Senior Associate' },
  { idGrade: 'GRD005', namaGrade: 'Specialist' },
  { idGrade: 'GRD006', namaGrade: 'Senior Specialist' },
  { idGrade: 'GRD007', namaGrade: 'Principal' },
  { idGrade: 'GRD008', namaGrade: 'Partner' },
  { idGrade: 'GRD009', namaGrade: 'Junior Officer' },
  { idGrade: 'GRD010', namaGrade: 'Officer' },
  { idGrade: 'GRD011', namaGrade: 'Senior Officer' },
  { idGrade: 'GRD012', namaGrade: 'Lead/Coordinator' },
  { idGrade: 'GRD013', namaGrade: 'Head' },
];

const STATUSES = [
  // Payment request flow
  { idStatus: 'ST_PAY_PENDING_OPS', namaStatus: 'Pending Ops', kategoriModul: 'payment_request' },
  { idStatus: 'ST_PAY_PENDING_PARTNER', namaStatus: 'Pending Partner', kategoriModul: 'payment_request' },
  { idStatus: 'ST_PAY_APPROVED', namaStatus: 'Approved', kategoriModul: 'payment_request' },
  { idStatus: 'ST_PAY_REJECTED', namaStatus: 'Rejected', kategoriModul: 'payment_request' },
  { idStatus: 'ST_PAY_SCHEDULED', namaStatus: 'Scheduled', kategoriModul: 'payment_request' },
  { idStatus: 'ST_PAY_PAID', namaStatus: 'Paid', kategoriModul: 'payment_request' },

  // Leave request flow
  { idStatus: 'ST_LEAVE_PENDING', namaStatus: 'Pending', kategoriModul: 'cuti' },
  { idStatus: 'ST_LEAVE_APPROVED', namaStatus: 'Approved', kategoriModul: 'cuti' },
  { idStatus: 'ST_LEAVE_REJECTED', namaStatus: 'Rejected', kategoriModul: 'cuti' },

  // Contract
  { idStatus: 'ST_KON_ACTIVE', namaStatus: 'Active', kategoriModul: 'kontrak' },
  { idStatus: 'ST_KON_EXPIRING', namaStatus: 'Expiring', kategoriModul: 'kontrak' },
  { idStatus: 'ST_KON_EXPIRED', namaStatus: 'Expired', kategoriModul: 'kontrak' },

  // Talent / assessment
  { idStatus: 'ST_TAL_PENDING', namaStatus: 'Pending Assessment', kategoriModul: 'talent' },
  { idStatus: 'ST_TAL_DONE', namaStatus: 'Assessed', kategoriModul: 'talent' },

  // Medical
  { idStatus: 'ST_MED_PENDING', namaStatus: 'Pending', kategoriModul: 'sakit' },
  { idStatus: 'ST_MED_VERIFIED', namaStatus: 'Verified', kategoriModul: 'sakit' },
  { idStatus: 'ST_MED_REJECTED', namaStatus: 'Rejected', kategoriModul: 'sakit' },

  // Assessment
  { idStatus: 'ST_ASM_OPEN', namaStatus: 'Open', kategoriModul: 'assessment' },
  { idStatus: 'ST_ASM_CLOSED', namaStatus: 'Closed', kategoriModul: 'assessment' },
];

const JENIS_CUTI = [
  { idJenisCuti: 'JC01', namaJenis: 'Paid Leave' },
  { idJenisCuti: 'JC02', namaJenis: 'Special Leave' },
  { idJenisCuti: 'JC03', namaJenis: 'Unpaid Leave' },
  { idJenisCuti: 'JC04', namaJenis: 'Compensatory Leave' },
];

const KATEGORI_PENYAKIT = [
  { idKategori: 'KP01', namaKategori: 'Fever' },
  { idKategori: 'KP02', namaKategori: 'Migraine' },
  { idKategori: 'KP03', namaKategori: 'Flu' },
  { idKategori: 'KP04', namaKategori: 'Other' },
];

const KATEGORI_PAYMENT = [
  { idKategori: 'KPY01', namaKategori: 'Vendor' },
  { idKategori: 'KPY02', namaKategori: 'Individual' },
  { idKategori: 'KPY03', namaKategori: 'Per Diem' },
];

const KONTRAK = [
  { idKontrak: 'KTR001', idKaryawan: 'KRY001', hariMulai: -400, hariBerakhir: 180, carryOver: 6, annualQuota: 12 },
  { idKontrak: 'KTR002', idKaryawan: 'KRY002', hariMulai: -300, hariBerakhir: 250, carryOver: 4, annualQuota: 12 },
  { idKontrak: 'KTR003', idKaryawan: 'KRY003', hariMulai: -350, hariBerakhir: 75, carryOver: 5, annualQuota: 12 },
  { idKontrak: 'KTR004', idKaryawan: 'KRY004', hariMulai: -500, hariBerakhir: 70, carryOver: 8, annualQuota: 12 },
  { idKontrak: 'KTR005', idKaryawan: 'KRY005', hariMulai: -380, hariBerakhir: 45, carryOver: 6, annualQuota: 12 },
  { idKontrak: 'KTR006', idKaryawan: 'KRY006', hariMulai: -260, hariBerakhir: 20, carryOver: 3, annualQuota: 12 },
  { idKontrak: 'KTR007', idKaryawan: 'KRY007', hariMulai: -220, hariBerakhir: 100, carryOver: 2, annualQuota: 12 },
  { idKontrak: 'KTR008', idKaryawan: 'KRY008', hariMulai: -300, hariBerakhir: 5, carryOver: 4, annualQuota: 12 },
  { idKontrak: 'KTR009', idKaryawan: 'KRY009', hariMulai: -150, hariBerakhir: 30, carryOver: 1, annualQuota: 12 },
  { idKontrak: 'KTR010', idKaryawan: 'KRY010', hariMulai: -100, hariBerakhir: 60, carryOver: 0, annualQuota: 12 },
];

const LOWONGAN = [
  { idLowongan: 'LWG001', namaPosisi: 'Senior Consultant - Education', deskripsi: 'Lead consulting projects in the education sector.', idStatus: 'OPEN', googleFormURL: 'https://forms.gle/education-consultant' },
  { idLowongan: 'LWG002', namaPosisi: 'Junior Analyst - Digital', deskripsi: 'Assist in digital transformation projects.', idStatus: 'OPEN', googleFormURL: 'https://forms.gle/junior-analyst-digital' },
  { idLowongan: 'LWG003', namaPosisi: 'Project Manager - Operations', deskripsi: 'Manage end-to-end operational projects.', idStatus: 'OPEN', googleFormURL: 'https://forms.gle/pm-operations' },
  { idLowongan: 'LWG004', namaPosisi: 'Finance Officer', deskripsi: 'Handle financial reporting and analysis.', idStatus: 'CLOSED', googleFormURL: null },
];

// Assessment contoh: 1 OPEN (sedang berjalan) yang dipakai berulang tiap periode.
// Kategori & kompetensi memakai template 6 bidang (lib/assessment-template.ts).
let _catSeq = 0;
let _qSeq = 0;
function buildCategories() {
  return ASSESSMENT_FIELDS.map((f) => ({
    idKategoriAsm: `ASC${String(++_catSeq).padStart(3, '0')}`,
    namaKategori: f.namaKategori,
    questions: f.kompetensi.map((teks) => ({
      idPertanyaan: `ASQ${String(++_qSeq).padStart(3, '0')}`,
      teks,
    })),
  }));
}

const ASSESSMENT_CATALOG = [
  {
    idAssessment: 'ASM001',
    judul: 'Competency Assessment',
    deskripsi: 'Self assessment of all employees.',
    idStatus: 'ST_ASM_OPEN',
    categories: buildCategories(),
  },
];

// dummmy password for all users
const PASSWORD = 'amana123'; // all dummy users share same password

const EXCLUDED_NAMES = [
  'Normandhieva Achmad Syuhada',
  'Trisatya Krisnawan',
  'Silvia Rahmawati',
  'Try Fathur Rachman',
  'Andi Muhammad Fadhli',
];

function mapGrade(grade: string): string {
  const m: Record<string, string> = {
    'Head (Partner)': 'GRD013',
    'Partner': 'GRD008',
    'Senior Associate': 'GRD004',
    'Specialist': 'GRD005',
    'Associate': 'GRD003',
    'Lead': 'GRD012',
    'Senior Analyst': 'GRD002',
    'Analyst': 'GRD001',
    'Officer': 'GRD010',
    'Junior Officer': 'GRD009',
  };
  return m[grade] || 'GRD001';
}

function mapDepartment(pg: string): string {
  const m: Record<string, string> = {
    'Strategy and Transformation': 'strategy',
    'Digital': 'digital',
    'Education': 'education',
    'Health & Wellbeing': 'health',
    'Health': 'health',
    'Operations': 'ops',
  };
  return m[pg] || 'ops';
}

function mapRole(role: string): string {
  if (role === 'Partner') return ROLES.PARTNER;
  if (role === 'OPS ADMIN') return ROLES.ADMIN_OPS;
  if (role === 'HR ADMIN') return ROLES.ADMIN_HR;
  return ROLES.EMPLOYEE;
}

function parseIdDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const months: Record<string, number> = {
    'Januari': 1, 'January': 1, 'Februari': 2, 'February': 2, 'Maret': 3, 'March': 3,
    'April': 4, 'Mei': 5, 'May': 5, 'Juni': 6, 'June': 6,
    'Juli': 7, 'July': 7, 'Agustus': 8, 'August': 8, 'September': 9,
    'Oktober': 10, 'October': 10, 'November': 11, 'Desember': 12, 'December': 12,
  };
  const parts = dateStr.trim().split(' ');
  const m = months[parts[1]];
  if (!m) return null;
  return new Date(parseInt(parts[2]), m - 1, parseInt(parts[0]));
}

function requireDate(dateStr: string): Date {
  const d = parseIdDate(dateStr);
  if (!d) throw new Error(`Date required but got empty: "${dateStr}"`);
  return d;
}

type TSVUser = {
  idKaryawan: string;
  nama: string;
  email: string;
  noTelepon: string;
  idGrade: string;
  department: string;
  role: string;
  tanggalMasuk: string;
  tipeKontrak: string;
  kontrak: { tanggalMulai: string; tanggalBerakhir: string; carryOver: number }[];
};

type SeedUser = {
  email: string;
  nama: string;
  role: string;
  idKaryawan: string;
  idGrade: string | null;
  department: string | null;
  tanggalLahir: string;
  tanggalMasuk: string;
};

const USERS: SeedUser[] = [
  // Admin HR
  {
    email: 'hradmin@company',
    nama: 'Citra Lestari',
    role: ROLES.ADMIN_HR,
    idKaryawan: 'KRY001',
    idGrade: null,
    department: 'education', // matriks approver cuti: Admin HR -> Partner Education & HR
    tanggalLahir: '1990-05-15',
    tanggalMasuk: '2020-01-10',
  },

  // Admin OPS
  {
    email: 'opsadmin@company',
    nama: 'Dimas Prayoga',
    role: ROLES.ADMIN_OPS,
    idKaryawan: 'KRY002',
    idGrade: 'GRD010',
    department: 'ops',
    tanggalLahir: '1991-03-22',
    tanggalMasuk: '2020-06-01',
  },

  // Partners (4 pillars)
  {
    email: 'partnerhealth@company',
    nama: 'Eka Pratiwi',
    role: ROLES.PARTNER,
    idKaryawan: 'KRY003',
    idGrade: 'GRD008',
    department: 'health',
    tanggalLahir: '1980-07-09',
    tanggalMasuk: '2015-02-15',
  },
  {
    email: 'partnerdigital@company',
    nama: 'Fitri Handayani',
    role: ROLES.PARTNER,
    idKaryawan: 'KRY004',
    idGrade: 'GRD008',
    department: 'digital',
    tanggalLahir: '1979-11-30',
    tanggalMasuk: '2014-08-01',
  },
  {
    email: 'partnereducation@company',
    nama: 'Gilang Ramadhan',
    role: ROLES.PARTNER,
    idKaryawan: 'KRY005',
    idGrade: 'GRD008',
    department: 'education',
    tanggalLahir: '1982-05-18',
    tanggalMasuk: '2013-04-20',
  },
  {
    email: 'headops@company',
    nama: 'Budi Santoso',
    role: ROLES.PARTNER,
    idKaryawan: 'KRY006',
    idGrade: 'GRD013',
    department: 'ops',
    tanggalLahir: '1983-02-27',
    tanggalMasuk: '2014-09-01',
  },

  // Employees (Practice Group)
  {
    email: 'ahmadfauzi@company',
    nama: 'Ahmad Fauzi',
    role: ROLES.EMPLOYEE,
    idKaryawan: 'KRY007',
    idGrade: 'GRD003',
    department: 'health',
    tanggalLahir: '1995-04-11',
    tanggalMasuk: '2021-03-01',
  },
  {
    email: 'saridewi@company',
    nama: 'Sari Dewi',
    role: ROLES.EMPLOYEE,
    idKaryawan: 'KRY008',
    idGrade: 'GRD002',
    department: 'digital',
    tanggalLahir: '1996-08-24',
    tanggalMasuk: '2022-01-15',
  },
  {
    email: 'budihartono@company',
    nama: 'Budi Hartono',
    role: ROLES.EMPLOYEE,
    idKaryawan: 'KRY009',
    idGrade: 'GRD004',
    department: 'education',
    tanggalLahir: '1993-12-05',
    tanggalMasuk: '2021-07-01',
  },

  // One OPS employee (non-admin)
  {
    email: 'dewilestari@company',
    nama: 'Dewi Lestari',
    role: ROLES.EMPLOYEE,
    idKaryawan: 'KRY010',
    idGrade: 'GRD011',
    department: 'ops',
    tanggalLahir: '1994-06-14',
    tanggalMasuk: '2022-03-01',
  },
];

const KONTRAK_BARU: { idKontrak: string; idKaryawan: string; tanggalMulai: Date; tanggalBerakhir: Date; carryOver: number; annualQuota: number }[] = [
  { idKontrak: 'KTR011', idKaryawan: 'KRY011', tanggalMulai: requireDate('1 April 2025'), tanggalBerakhir: requireDate('31 December 2099'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR012', idKaryawan: 'KRY012', tanggalMulai: requireDate('1 April 2025'), tanggalBerakhir: requireDate('31 December 2099'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR013', idKaryawan: 'KRY013', tanggalMulai: requireDate('1 April 2025'), tanggalBerakhir: requireDate('29 October 2025'), carryOver: 0, annualQuota: 7 },
  { idKontrak: 'KTR014', idKaryawan: 'KRY013', tanggalMulai: requireDate('1 November 2025'), tanggalBerakhir: requireDate('31 October 2026'), carryOver: 3, annualQuota: 12 },
  { idKontrak: 'KTR015', idKaryawan: 'KRY014', tanggalMulai: requireDate('1 April 2025'), tanggalBerakhir: requireDate('31 December 2099'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR016', idKaryawan: 'KRY015', tanggalMulai: requireDate('1 April 2026'), tanggalBerakhir: requireDate('31 March 2027'), carryOver: 4.5, annualQuota: 12 },
  { idKontrak: 'KTR017', idKaryawan: 'KRY016', tanggalMulai: requireDate('2 January 2026'), tanggalBerakhir: requireDate('1 January 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR018', idKaryawan: 'KRY017', tanggalMulai: requireDate('1 September 2025'), tanggalBerakhir: requireDate('31 August 2026'), carryOver: 7, annualQuota: 12 },
  { idKontrak: 'KTR019', idKaryawan: 'KRY018', tanggalMulai: requireDate('1 April 2025'), tanggalBerakhir: requireDate('31 December 2099'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR020', idKaryawan: 'KRY019', tanggalMulai: requireDate('1 August 2025'), tanggalBerakhir: requireDate('31 July 2026'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR021', idKaryawan: 'KRY019', tanggalMulai: requireDate('1 August 2026'), tanggalBerakhir: requireDate('31 July 2027'), carryOver: 5.5, annualQuota: 12 },
  { idKontrak: 'KTR022', idKaryawan: 'KRY020', tanggalMulai: requireDate('1 September 2026'), tanggalBerakhir: requireDate('31 August 2027'), carryOver: 2, annualQuota: 12 },
  { idKontrak: 'KTR023', idKaryawan: 'KRY021', tanggalMulai: requireDate('1 April 2026'), tanggalBerakhir: requireDate('31 March 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR024', idKaryawan: 'KRY022', tanggalMulai: requireDate('1 January 2026'), tanggalBerakhir: requireDate('31 December 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR025', idKaryawan: 'KRY023', tanggalMulai: requireDate('1 November 2025'), tanggalBerakhir: requireDate('31 October 2026'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR026', idKaryawan: 'KRY024', tanggalMulai: requireDate('1 October 2025'), tanggalBerakhir: requireDate('30 September 2026'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR027', idKaryawan: 'KRY025', tanggalMulai: requireDate('16 July 2026'), tanggalBerakhir: requireDate('15 July 2027'), carryOver: 4.5, annualQuota: 12 },
  { idKontrak: 'KTR028', idKaryawan: 'KRY026', tanggalMulai: requireDate('1 December 2025'), tanggalBerakhir: requireDate('30 November 2026'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR029', idKaryawan: 'KRY027', tanggalMulai: requireDate('25 August 2026'), tanggalBerakhir: requireDate('24 August 2027'), carryOver: 2, annualQuota: 12 },
  { idKontrak: 'KTR030', idKaryawan: 'KRY028', tanggalMulai: requireDate('26 August 2026'), tanggalBerakhir: requireDate('25 August 2027'), carryOver: 5.5, annualQuota: 12 },
  { idKontrak: 'KTR031', idKaryawan: 'KRY029', tanggalMulai: requireDate('1 October 2025'), tanggalBerakhir: requireDate('30 September 2026'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR032', idKaryawan: 'KRY030', tanggalMulai: requireDate('27 January 2026'), tanggalBerakhir: requireDate('26 January 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR033', idKaryawan: 'KRY031', tanggalMulai: requireDate('1 December 2025'), tanggalBerakhir: requireDate('30 November 2026'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR034', idKaryawan: 'KRY032', tanggalMulai: requireDate('15 January 2026'), tanggalBerakhir: requireDate('14 September 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR035', idKaryawan: 'KRY033', tanggalMulai: requireDate('1 August 2026'), tanggalBerakhir: requireDate('31 July 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR036', idKaryawan: 'KRY034', tanggalMulai: requireDate('19 April 2026'), tanggalBerakhir: requireDate('18 April 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR037', idKaryawan: 'KRY035', tanggalMulai: requireDate('1 July 2026'), tanggalBerakhir: requireDate('30 June 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR038', idKaryawan: 'KRY036', tanggalMulai: requireDate('1 April 2026'), tanggalBerakhir: requireDate('31 March 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR039', idKaryawan: 'KRY037', tanggalMulai: requireDate('6 July 2026'), tanggalBerakhir: requireDate('5 July 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR040', idKaryawan: 'KRY038', tanggalMulai: requireDate('2 July 2026'), tanggalBerakhir: requireDate('1 July 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR041', idKaryawan: 'KRY039', tanggalMulai: requireDate('2 July 2026'), tanggalBerakhir: requireDate('1 July 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR042', idKaryawan: 'KRY040', tanggalMulai: requireDate('6 July 2026'), tanggalBerakhir: requireDate('5 July 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR043', idKaryawan: 'KRY041', tanggalMulai: requireDate('13 July 2026'), tanggalBerakhir: requireDate('12 July 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR044', idKaryawan: 'KRY042', tanggalMulai: requireDate('17 August 2026'), tanggalBerakhir: requireDate('16 August 2027'), carryOver: 0, annualQuota: 12 },
  { idKontrak: 'KTR045', idKaryawan: 'KRY043', tanggalMulai: requireDate('1 September 2026'), tanggalBerakhir: requireDate('31 August 2027'), carryOver: 0, annualQuota: 12 },
];

const TSV_USERS: TSVUser[] = [
  { idKaryawan: 'KRY011', nama: 'Kevin Tan', email: 'kevin@amana.id', noTelepon: '+6281285001637', idGrade: 'GRD013', department: 'ops', role: ROLES.PARTNER, tanggalMasuk: '1 April 2025', tipeKontrak: 'PERMANEN', kontrak: [{ tanggalMulai: '1 April 2025', tanggalBerakhir: '31 December 2099', carryOver: 0 }] },
  { idKaryawan: 'KRY012', nama: 'Prasetya Dwicahya', email: 'pras@amana.id', noTelepon: '+6281299398911', idGrade: 'GRD008', department: 'strategy', role: ROLES.PARTNER, tanggalMasuk: '1 April 2025', tipeKontrak: 'PERMANEN', kontrak: [{ tanggalMulai: '1 April 2025', tanggalBerakhir: '31 December 2099', carryOver: 0 }] },
  { idKaryawan: 'KRY013', nama: 'Permata Imani Ima Silitonga', email: 'permata@amana.id', noTelepon: '+6281389364501', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '1 November 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 April 2025', tanggalBerakhir: '29 October 2025', carryOver: 0 }, { tanggalMulai: '1 November 2025', tanggalBerakhir: '31 October 2026', carryOver: 3 }] },
  { idKaryawan: 'KRY014', nama: 'Endiyan Rakhmanda', email: 'endiyan@amana.id', noTelepon: '+6281212915642', idGrade: 'GRD008', department: 'digital', role: ROLES.PARTNER, tanggalMasuk: '1 April 2025', tipeKontrak: 'PERMANEN', kontrak: [{ tanggalMulai: '1 April 2025', tanggalBerakhir: '31 December 2099', carryOver: 0 }] },
  { idKaryawan: 'KRY015', nama: 'Anezka Roseline Wee', email: 'anezka@amana.id', noTelepon: '+628111999510', idGrade: 'GRD003', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '1 April 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 April 2026', tanggalBerakhir: '31 March 2027', carryOver: 4.5 }] },
  { idKaryawan: 'KRY016', nama: 'Samuel Kharis Harianto', email: 'samuel.kharis@amana.id', noTelepon: '+6282140885381', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '2 January 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '2 January 2026', tanggalBerakhir: '1 January 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY017', nama: 'Hilmy Hanif', email: 'hanif@amana.id', noTelepon: '+628112107894', idGrade: 'GRD005', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '1 September 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 September 2025', tanggalBerakhir: '31 August 2026', carryOver: 7 }] },
  { idKaryawan: 'KRY018', nama: "Nya' Zata Amani", email: 'amani@amana.id', noTelepon: '+6285260519427', idGrade: 'GRD008', department: 'education', role: ROLES.PARTNER, tanggalMasuk: '1 April 2025', tipeKontrak: 'PERMANEN', kontrak: [{ tanggalMulai: '1 April 2025', tanggalBerakhir: '31 December 2099', carryOver: 0 }] },
  { idKaryawan: 'KRY019', nama: 'Rifdah Azzura Fasya', email: 'rifdah@amana.id', noTelepon: '+6285697613065', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '1 August 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 August 2025', tanggalBerakhir: '31 July 2026', carryOver: 0 }, { tanggalMulai: '1 August 2026', tanggalBerakhir: '31 July 2027', carryOver: 5.5 }] },
  { idKaryawan: 'KRY020', nama: 'Dilani Maryam', email: 'dilani@amana.id', noTelepon: '+6281212742037', idGrade: 'GRD005', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '1 September 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 September 2026', tanggalBerakhir: '31 August 2027', carryOver: 2 }] },
  { idKaryawan: 'KRY021', nama: 'Giodio Nathanael Pratama Mitaart', email: 'dio@amana.id', noTelepon: '+6282248069914', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '1 April 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 April 2026', tanggalBerakhir: '31 March 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY022', nama: 'Witania Cahyadi', email: 'wita@amana.id', noTelepon: '+6285711824619', idGrade: 'GRD010', department: 'ops', role: ROLES.ADMIN_OPS, tanggalMasuk: '1 January 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 January 2026', tanggalBerakhir: '31 December 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY023', nama: 'Diyon Iskandar Setiawan', email: 'diyon@amana.id', noTelepon: '+6281285723871', idGrade: 'GRD004', department: 'education', role: ROLES.EMPLOYEE, tanggalMasuk: '1 November 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 November 2025', tanggalBerakhir: '31 October 2026', carryOver: 0 }] },
  { idKaryawan: 'KRY024', nama: 'Naufal Hilmi', email: 'hilmi@amana.id', noTelepon: '+628111480497', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '1 October 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 October 2025', tanggalBerakhir: '30 September 2026', carryOver: 0 }] },
  { idKaryawan: 'KRY025', nama: 'Helen Solagratiaputri', email: 'helen@amana.id', noTelepon: '+628996649908', idGrade: 'GRD002', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '16 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '16 July 2026', tanggalBerakhir: '15 July 2027', carryOver: 4.5 }] },
  { idKaryawan: 'KRY026', nama: 'Isna Farhani', email: 'isna@amana.id', noTelepon: '+6281386627931', idGrade: 'GRD012', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '1 December 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 December 2025', tanggalBerakhir: '30 November 2026', carryOver: 0 }] },
  { idKaryawan: 'KRY027', nama: 'Athar Raihan Muhammad', email: 'athar@amana.id', noTelepon: '+6281261093672', idGrade: 'GRD003', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '25 August 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '25 August 2026', tanggalBerakhir: '24 August 2027', carryOver: 2 }] },
  { idKaryawan: 'KRY028', nama: 'Andara Chantika Rahmadina', email: 'andara@amana.id', noTelepon: '+6281805899981', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '26 August 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '26 August 2026', tanggalBerakhir: '25 August 2027', carryOver: 5.5 }] },
  { idKaryawan: 'KRY029', nama: 'Nadhira Zahrany Wishnuputri', email: 'nadhira@amana.id', noTelepon: '+6281288486986', idGrade: 'GRD003', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '1 October 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 October 2025', tanggalBerakhir: '30 September 2026', carryOver: 0 }] },
  { idKaryawan: 'KRY030', nama: 'Kaysea Safadristi Narendragharini', email: 'kaysea@amana.id', noTelepon: '+6282283260793', idGrade: 'GRD001', department: 'education', role: ROLES.EMPLOYEE, tanggalMasuk: '27 January 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '27 January 2026', tanggalBerakhir: '26 January 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY031', nama: 'Aulia Chairunisa', email: 'aulia@amana.id', noTelepon: '+6281510448552', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '1 December 2025', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 December 2025', tanggalBerakhir: '30 November 2026', carryOver: 0 }] },
  { idKaryawan: 'KRY032', nama: 'Melvin Ezekiel', email: 'melvin@amana.id', noTelepon: '+6281280478437', idGrade: 'GRD001', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '15 January 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '15 January 2026', tanggalBerakhir: '14 September 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY033', nama: 'Dwi Ardiansyah', email: 'dwi@amana.id', noTelepon: '+6288228150529', idGrade: 'GRD003', department: 'education', role: ROLES.EMPLOYEE, tanggalMasuk: '1 August 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 August 2026', tanggalBerakhir: '31 July 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY034', nama: 'Farani Nazwa Chairunisa Irsan', email: 'aya@amana.id', noTelepon: '+6281232001344', idGrade: 'GRD002', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '19 April 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '19 April 2026', tanggalBerakhir: '18 April 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY035', nama: 'Adzkia Zahra Izzati', email: 'adzkia@amana.id', noTelepon: '+6282119294713', idGrade: 'GRD002', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '1 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 July 2026', tanggalBerakhir: '30 June 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY036', nama: 'Hilda Julaika', email: 'hilda@amana.id', noTelepon: '+6287827734297', idGrade: 'GRD010', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '1 April 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 April 2026', tanggalBerakhir: '31 March 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY037', nama: 'Siti Nabila Azuraa Basri', email: 'nabila@amana.id', noTelepon: '81111806271', idGrade: 'GRD010', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '6 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '6 July 2026', tanggalBerakhir: '5 July 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY038', nama: 'Clarence Fulgentius Tjandera', email: 'clarence@amana.id', noTelepon: '85714892195', idGrade: 'GRD001', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '2 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '2 July 2026', tanggalBerakhir: '1 July 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY039', nama: 'Nurul Fikriyah', email: 'nurul@amana.id', noTelepon: '+6282178646363', idGrade: 'GRD010', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '2 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '2 July 2026', tanggalBerakhir: '1 July 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY040', nama: 'Jennie Tania', email: 'jennie@amana.id', noTelepon: '85315053107', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '6 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '6 July 2026', tanggalBerakhir: '5 July 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY041', nama: 'Iqbal Fahmi', email: 'Iqbal@amana.id', noTelepon: '82187617252', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '13 July 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '13 July 2026', tanggalBerakhir: '12 July 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY042', nama: 'Syifa Fauziah', email: 'Syifa@amana.id', noTelepon: '81315995895', idGrade: 'GRD003', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '17 August 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '17 August 2026', tanggalBerakhir: '16 August 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY043', nama: 'Olive Aturan Cornella', email: 'olive@amana.id', noTelepon: '87882248865', idGrade: 'GRD003', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '1 September 2026', tipeKontrak: 'KONTRAK', kontrak: [{ tanggalMulai: '1 September 2026', tanggalBerakhir: '31 August 2027', carryOver: 0 }] },
  { idKaryawan: 'KRY044', nama: 'Andi Muhammad Fadhli', email: 'andi@amana.id', noTelepon: '81283378976', idGrade: 'GRD001', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'INTERNSHIP', kontrak: [] },
  // KKI employees
  { idKaryawan: 'KRY045', nama: 'Fia Mahanani', email: 'fia@amana.id', noTelepon: '+6285210494774', idGrade: 'GRD005', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY046', nama: 'Regina Retno Putri Manjali', email: 'regina@amana.id', noTelepon: '+6281112120066', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY047', nama: 'Denisa Widyaputri', email: 'denisa@amana.id', noTelepon: '+62818152817', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY048', nama: 'Tasha Nastiti Waris', email: 'tasha@amana.id', noTelepon: '+6281271818193', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY049', nama: 'Siti Inertia', email: 'iner@amana.id', noTelepon: '+60143826264', idGrade: 'GRD011', department: 'ops', role: ROLES.ADMIN_HR, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY050', nama: 'Robby Hertanto', email: 'robby@amana.id', noTelepon: '+6287878393916', idGrade: 'GRD005', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY051', nama: 'Rahmat Hidayat Syahputra', email: 'rahmat@amana.id', noTelepon: '+628116607800', idGrade: 'GRD003', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY052', nama: 'Amirah', email: 'amira@amana.id', noTelepon: '+31630573704', idGrade: 'GRD003', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY053', nama: 'Jamilatuzzahro', email: 'zahro@amana.id', noTelepon: '+6281324296643', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY054', nama: 'Avyandra Rizka Putri', email: 'avy@amana.id', noTelepon: '+6281223453798', idGrade: 'GRD003', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY055', nama: 'Binar Asri Lestari', email: 'binar@amana.id', noTelepon: '+6289532247421', idGrade: 'GRD005', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY056', nama: 'Azhar Dzakwan Azizi', email: 'azhar@amana.id', noTelepon: '+628199420022', idGrade: 'GRD001', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY057', nama: 'Alexander Michael Tjahjadi', email: 'michael@amana.id', noTelepon: '+6281286259933', idGrade: 'GRD005', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY058', nama: 'Herman Yoseph Fernando', email: 'yoseph@amana.id', noTelepon: '+6281293080875', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY059', nama: 'Dian Faradiba', email: 'dian@amana.id', noTelepon: '+6281917473518', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY060', nama: 'Aditiya Bagus Wicaksono', email: 'aditiya.wicaksono@amana.id', noTelepon: '+628111099727', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY061', nama: 'Prinvia Prichariel', email: 'via@amana.id', noTelepon: '+628111076381', idGrade: 'GRD002', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY062', nama: 'Okky Oktaviani', email: 'okky@amana.id', noTelepon: '+6281284235501', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY063', nama: 'Asti Shafira', email: 'asti@amana.id', noTelepon: '+18579953474', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY064', nama: 'Reza Virly Alfriansyach', email: 'reza@amana.id', noTelepon: '+6281384521752', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY065', nama: 'Malindo Andhi Saputra Marpaung', email: 'malindo@amana.id', noTelepon: '+6281219393696', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY066', nama: 'Kemal Faizal Hermawan', email: 'kemal@amana.id', noTelepon: '+6285156937387', idGrade: 'GRD010', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY067', nama: 'Naomi Shanda Kandita', email: 'naomi@amana.id', noTelepon: '+6281290928545', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY068', nama: 'Sofwan Hakim', email: 'sofwan@amana.id', noTelepon: '+6287877384998', idGrade: 'GRD006', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY069', nama: 'Vannesya Harahap', email: 'Vannesya@amana.id', noTelepon: '81904051153', idGrade: 'GRD003', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY070', nama: 'Barrakha Kugitama', email: 'barra@amana.id', noTelepon: '+6281386590703', idGrade: 'GRD003', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY071', nama: 'Elliana Azzahra Ayuningrum', email: 'elli@amana.id', noTelepon: '081283239966', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY072', nama: 'Nurilla Azizah', email: 'Nuril@amana.id', noTelepon: '8568989214', idGrade: 'GRD005', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY073', nama: 'Rifan Kurnia', email: 'Rifan@amana.id', noTelepon: '', idGrade: 'GRD006', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY074', nama: 'Arian Chandra Aditiar', email: 'arian@amana.id', noTelepon: '82128187334', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY075', nama: 'Dara Adinda Kesuma Nasution', email: 'dara@amana.id', noTelepon: '+628118236111', idGrade: 'GRD006', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY076', nama: 'Goldy Fariz Dharmawan', email: 'Goldy@amana.id', noTelepon: '+628176420703', idGrade: 'GRD003', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY077', nama: 'Lalitia Apsari', email: 'Lalitia@amana.id', noTelepon: '81284025992', idGrade: 'GRD006', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY078', nama: 'Reza Safaruddin Purnama', email: 'reza.purnama@amana.id', noTelepon: '', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY079', nama: 'Rara Nurul Izzah', email: 'rara@amana.id', noTelepon: '82112469968', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY080', nama: 'Muhammad Fhadli', email: 'Fhadli@amana.id', noTelepon: '81337208117', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY081', nama: 'Yohannes Maria Vianney Widoputranto', email: 'vian@amana.id', noTelepon: '81298550068', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY082', nama: 'Surya Kusuma Ardhani', email: 'surya@amana.id', noTelepon: '82266601992', idGrade: 'GRD009', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY083', nama: 'Ahmad Hidayat', email: 'ahmad@amana.id', noTelepon: '818181254', idGrade: 'GRD006', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY084', nama: 'Widya Yusni Asriyanti', email: 'widya@amana.id', noTelepon: '87887317258', idGrade: 'GRD010', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY085', nama: 'Adhitya Rangga Putra', email: 'rangga@amana.id', noTelepon: '8888398184', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY086', nama: 'Ivan Meidika Kurnia', email: 'ivan.meidika@amana.id', noTelepon: '+6285157535550', idGrade: 'GRD004', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY087', nama: 'Andarini Sertianti', email: 'andarini@amana.id', noTelepon: '81181213272', idGrade: 'GRD006', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY088', nama: 'Larasati Sudirman', email: 'laras@amana.id', noTelepon: '+6281230609765', idGrade: 'GRD004', department: 'strategy', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY089', nama: 'Eka Fajri Setiawan', email: 'fajri@amana.id', noTelepon: '+6285278289903', idGrade: 'GRD005', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY090', nama: 'Rita Damayanti', email: 'rita@amana.id', noTelepon: '81269093257', idGrade: 'GRD004', department: 'digital', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  { idKaryawan: 'KRY091', nama: 'Aulia Azizah', email: 'aulia.azizah@amana.id', noTelepon: '82253007462', idGrade: 'GRD010', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'KKI', kontrak: [] },
  // INTERNSHIP employees
  { idKaryawan: 'KRY092', nama: 'Dimas Nurcahya', email: 'dimas@amana.id', noTelepon: '+62895613165087', idGrade: 'GRD001', department: 'health', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'INTERNSHIP', kontrak: [] },
  { idKaryawan: 'KRY093', nama: 'Rafael Sadewo Ai Sakti', email: 'rafael@amana.id', noTelepon: '81383988829', idGrade: 'GRD001', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'INTERNSHIP', kontrak: [] },
  { idKaryawan: 'KRY094', nama: 'Muhammad Rafli Abidi Utama', email: 'abidi@amana.id', noTelepon: '81218261064', idGrade: 'GRD001', department: 'ops', role: ROLES.EMPLOYEE, tanggalMasuk: '', tipeKontrak: 'INTERNSHIP', kontrak: [] },
];

async function main() {
  console.log('🌱 Seeding database...');

  // 0. Remove excluded users and their data
  for (const name of EXCLUDED_NAMES) {
    const existingUser = await prisma.user.findFirst({
      where: { email: { contains: name.split(' ')[0].toLowerCase() } },
    });
    if (existingUser) {
      await prisma.assessmentAnswer.deleteMany({ where: { idSubmission: { startsWith: 'SUB-' + existingUser.idUser } } }).catch(() => {});
      await prisma.assessmentSubmission.deleteMany({ where: { idKaryawan: existingUser.idUser } }).catch(() => {});
      await prisma.kontrakKaryawan.deleteMany({ where: { idKaryawan: existingUser.idUser } }).catch(() => {});
      await prisma.karyawan.delete({ where: { idKaryawan: existingUser.idUser } }).catch(() => {});
      await prisma.user.delete({ where: { idUser: existingUser.idUser } }).catch(() => {});
    }
  }

  // 0b. Clean up any partially-seeded TSV users (KRY011+) to avoid conflicts
  for (const u of TSV_USERS) {
    const existing = await prisma.user.findUnique({ where: { idUser: u.idKaryawan } });
    if (existing) {
      await prisma.assessmentAnswer.deleteMany({ where: { idSubmission: { startsWith: 'SUB-' + u.idKaryawan } } }).catch(() => {});
      await prisma.assessmentSubmission.deleteMany({ where: { idKaryawan: u.idKaryawan } }).catch(() => {});
      await prisma.kontrakKaryawan.deleteMany({ where: { idKaryawan: u.idKaryawan } }).catch(() => {});
      await prisma.karyawan.delete({ where: { idKaryawan: u.idKaryawan } }).catch(() => {});
      await prisma.user.delete({ where: { idUser: u.idKaryawan } }).catch(() => {});
    }
  }

  // 1. Roles
  const roleRecords = [
    { idRole: ROLES.EMPLOYEE, namaRole: 'Employee' },
    { idRole: ROLES.PARTNER, namaRole: 'Partner' },
    { idRole: ROLES.ADMIN_HR, namaRole: 'Admin HR' },
    { idRole: ROLES.ADMIN_OPS, namaRole: 'Admin OPS' },
  ];
  for (const r of roleRecords) {
    await prisma.role.upsert({
      where: { idRole: r.idRole },
      update: { namaRole: r.namaRole },
      create: r,
    });
  }

  // 2. Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { idPermission: p.id },
      update: { namaAction: p.namaAction },
      create: { idPermission: p.id, namaAction: p.namaAction },
    });
  }

  // 3. RolePermission
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: { idRole_idPermission: { idRole: role, idPermission: perm } },
        update: {},
        create: { idRole: role, idPermission: perm },
      });
    }
  }

  // 4. MasterGrade
  for (const g of GRADES) {
    await prisma.masterGrade.upsert({
      where: { idGrade: g.idGrade },
      update: { namaGrade: g.namaGrade },
      create: g,
    });
  }

  // 4b. MasterDepartment
  const DEPARTMENTS = [
    { idDepartment: 'health', namaDepartment: 'Health & Wellbeing', urutan: 1 },
    { idDepartment: 'digital', namaDepartment: 'Digital & Finance', urutan: 2 },
    { idDepartment: 'education', namaDepartment: 'Education & HR', urutan: 3 },
    { idDepartment: 'ops', namaDepartment: 'Operations', urutan: 4 },
    { idDepartment: 'strategy', namaDepartment: 'Strategy and Transformation', urutan: 5 },
  ];
  for (const d of DEPARTMENTS) {
    await prisma.masterDepartment.upsert({
      where: { idDepartment: d.idDepartment },
      update: { namaDepartment: d.namaDepartment, urutan: d.urutan },
      create: d,
    });
  }

  // 5. MasterStatus
  for (const s of STATUSES) {
    await prisma.masterStatus.upsert({
      where: { idStatus: s.idStatus },
      update: { namaStatus: s.namaStatus, kategoriModul: s.kategoriModul },
      create: s,
    });
  }

  // 6. Master Jenis Cuti
  for (const j of JENIS_CUTI) {
    await prisma.masterJenisCuti.upsert({
      where: { idJenisCuti: j.idJenisCuti },
      update: { namaJenis: j.namaJenis },
      create: j,
    });
  }

  // 7. Master Kategori Penyakit
  for (const k of KATEGORI_PENYAKIT) {
    await prisma.masterKategoriPenyakit.upsert({
      where: { idKategori: k.idKategori },
      update: { namaKategori: k.namaKategori },
      create: k,
    });
  }

  // 8. Master Kategori Payment
  for (const k of KATEGORI_PAYMENT) {
    await prisma.masterKategoriPayment.upsert({
      where: { idKategori: k.idKategori },
      update: { namaKategori: k.namaKategori },
      create: k,
    });
  }

  // 9b. New Karyawan from TSV data
  for (const u of TSV_USERS) {
    await prisma.karyawan.upsert({
      where: { idKaryawan: u.idKaryawan },
      update: {
        idUser: u.idKaryawan,
        nama: u.nama,
        idGrade: u.idGrade,
        department: u.department,
        tanggalLahir: null,
        tanggalMasuk: parseIdDate(u.tanggalMasuk),
        tipeKontrak: u.tipeKontrak,
        noTelepon: u.noTelepon || null,
      },
      create: {
        idKaryawan: u.idKaryawan,
        idUser: u.idKaryawan,
        nama: u.nama,
        idGrade: u.idGrade,
        department: u.department,
        tanggalLahir: null,
        tanggalMasuk: parseIdDate(u.tanggalMasuk),
        tipeKontrak: u.tipeKontrak,
        sisaCutiTahunan: 12,
        accrualRate: 1,
        noTelepon: u.noTelepon || null,
      },
    });
  }

  // 10. Users
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { idRole: u.role, passwordHash },
      create: {
        idUser: u.idKaryawan,
        email: u.email,
        passwordHash,
        idRole: u.role,
      },
    });
  }

  // 10b. New Users from TSV data
  for (const u of TSV_USERS) {
    await prisma.user.upsert({
      where: { idUser: u.idKaryawan },
      update: { email: u.email, idRole: u.role, passwordHash },
      create: {
        idUser: u.idKaryawan,
        email: u.email,
        passwordHash,
        idRole: u.role,
      },
    });
  }

  // 11. Lowongan Karir
  for (const l of LOWONGAN) {
    await prisma.lowonganKarir.upsert({
      where: { idLowongan: l.idLowongan },
      update: { namaPosisi: l.namaPosisi, deskripsi: l.deskripsi, idStatus: l.idStatus, googleFormURL: l.googleFormURL },
      create: l,
    });
  }

  // 11b. Kontrak Karyawan
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  for (const k of KONTRAK) {
    const tanggalMulai = new Date(todayStart);
    tanggalMulai.setDate(tanggalMulai.getDate() + k.hariMulai);
    const tanggalBerakhir = new Date(todayStart);
    tanggalBerakhir.setDate(tanggalBerakhir.getDate() + k.hariBerakhir);
    await prisma.kontrakKaryawan.upsert({
      where: { idKontrak: k.idKontrak },
      update: {
        idKaryawan: k.idKaryawan,
        tanggalMulai,
        tanggalBerakhir,
        carryOver: k.carryOver,
        annualQuota: k.annualQuota,
        idStatus: 'ST_KON_ACTIVE',
      },
      create: {
        idKontrak: k.idKontrak,
        idKaryawan: k.idKaryawan,
        tanggalMulai,
        tanggalBerakhir,
        carryOver: k.carryOver,
        annualQuota: k.annualQuota,
        idStatus: 'ST_KON_ACTIVE',
      },
    });
  }

  // 11b. New Kontrak Karyawan from TSV data
  for (const k of KONTRAK_BARU) {
    await prisma.kontrakKaryawan.upsert({
      where: { idKontrak: k.idKontrak },
      update: {
        idKaryawan: k.idKaryawan,
        tanggalMulai: k.tanggalMulai,
        tanggalBerakhir: k.tanggalBerakhir,
        carryOver: k.carryOver,
        annualQuota: k.annualQuota,
        idStatus: 'ST_KON_ACTIVE',
      },
      create: {
        idKontrak: k.idKontrak,
        idKaryawan: k.idKaryawan,
        tanggalMulai: k.tanggalMulai,
        tanggalBerakhir: k.tanggalBerakhir,
        carryOver: k.carryOver,
        annualQuota: k.annualQuota,
        idStatus: 'ST_KON_ACTIVE',
      },
    });
  }

  // 12. Assessment + kategori/kompetensi
  for (const a of ASSESSMENT_CATALOG) {
    await prisma.assessment.upsert({
      where: { idAssessment: a.idAssessment },
      update: { judul: a.judul, deskripsi: a.deskripsi, idStatus: a.idStatus, tanggalBuka: new Date(), tanggalTutup: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      create: {
        idAssessment: a.idAssessment,
        judul: a.judul,
        deskripsi: a.deskripsi,
        idStatus: a.idStatus,
        tanggalBuka: new Date(),
        tanggalTutup: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });
    for (const c of a.categories) {
      await prisma.assessmentCategory.upsert({
        where: { idKategoriAsm: c.idKategoriAsm },
        update: { namaKategori: c.namaKategori, idAssessment: a.idAssessment },
        create: { idKategoriAsm: c.idKategoriAsm, namaKategori: c.namaKategori, idAssessment: a.idAssessment },
      });
      for (const q of c.questions) {
        await prisma.assessmentQuestion.upsert({
          where: { idPertanyaan: q.idPertanyaan },
          update: { teks: q.teks, idKategoriAsm: c.idKategoriAsm },
          create: { idPertanyaan: q.idPertanyaan, teks: q.teks, idKategoriAsm: c.idKategoriAsm, urutan: c.questions.indexOf(q) + 1 },
        });
      }
    }
  }

  // 12b. Assessment submissions for new employees (dummy answers, level=3)
  const totalQuestions = ASSESSMENT_FIELDS.reduce((sum, f) => sum + f.kompetensi.length, 0);
  for (const u of TSV_USERS) {
    const submissionId = `SUB-${u.idKaryawan}`;
    await prisma.assessmentSubmission.upsert({
      where: { idSubmission: submissionId },
      update: {
        tanggalSelesai: new Date(),
      },
      create: {
        idSubmission: submissionId,
        idKaryawan: u.idKaryawan,
        idAssessment: 'ASM001',
        tanggalSelesai: new Date(),
      },
    });
    for (let i = 1; i <= totalQuestions; i++) {
      const answerId = `ANS-${u.idKaryawan}-${String(i).padStart(3, '0')}`;
      const questionId = `ASQ${String(i).padStart(3, '0')}`;
      await prisma.assessmentAnswer.upsert({
        where: { idJawaban: answerId },
        update: { level: 3 },
        create: {
          idJawaban: answerId,
          idSubmission: submissionId,
          idPertanyaan: questionId,
          level: 3,
        },
      });
    }
  }

  console.log('✅ Seeding selesai.');
  console.log('   Dummy login password untuk semua user: ' + PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });