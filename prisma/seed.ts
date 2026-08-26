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


async function main() {
  console.log('🌱 Seeding database...');

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

  // 9. Karyawan
  for (const u of USERS) {
    await prisma.karyawan.upsert({
      where: { idKaryawan: u.idKaryawan },
      update: {
        idUser: u.idKaryawan,
        nama: u.nama,
        idGrade: u.idGrade,
        department: u.department,
        tanggalLahir: new Date(u.tanggalLahir),
        tanggalMasuk: new Date(u.tanggalMasuk),
      },
      create: {
        idKaryawan: u.idKaryawan,
        idUser: u.idKaryawan,
        nama: u.nama,
        idGrade: u.idGrade,
        department: u.department,
        tanggalLahir: new Date(u.tanggalLahir),
        tanggalMasuk: new Date(u.tanggalMasuk),
        sisaCutiTahunan: 12,
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