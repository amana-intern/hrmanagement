import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = {
  ADMIN_HR: 'ROLE_ADMIN_HR',
  ADMIN_OPS: 'ROLE_ADMIN_OPS',
};

const PERMISSIONS: { id: string; namaAction: string }[] = [
  { id: 'profile:view_own', namaAction: 'View own profile' },
  { id: 'contract:view_expiry', namaAction: 'View contract expiry' },
  { id: 'contract:manage', namaAction: 'Manage contracts (renew/offboard)' },
  { id: 'medical:review', namaAction: 'Review medical leave' },
  { id: 'medical:export_csv', namaAction: 'Export attendance CSV' },
  { id: 'career:cms', namaAction: 'Manage job listings' },
  { id: 'talent:review', namaAction: 'Review talent roster' },
  { id: 'account:manage', namaAction: 'Activate/deactivate accounts' },
  { id: 'payment:review_approve', namaAction: 'Review & approve payment (level 1)' },
  { id: 'payment:schedule', namaAction: 'Schedule & pay payment' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
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
  { idGrade: 'GRD010', namaGrade: 'Officer' },
  { idGrade: 'GRD011', namaGrade: 'Senior Officer' },
];

const ADMIN_USERS = [
  {
    idKaryawan: 'KRY001',
    email: 'hradmin@amana.id',
    nama: 'Citra Lestari',
    role: ROLES.ADMIN_HR,
    idGrade: 'GRD011',
    department: 'ops',
    tanggalLahir: new Date('1990-05-15'),
    tanggalMasuk: new Date('2020-01-10'),
  },
  {
    idKaryawan: 'KRY002',
    email: 'opsadmin@amana.id',
    nama: 'Dimas Prayoga',
    role: ROLES.ADMIN_OPS,
    idGrade: 'GRD010',
    department: 'ops',
    tanggalLahir: new Date('1991-03-22'),
    tanggalMasuk: new Date('2020-06-01'),
  },
];

async function seedAdmins() {
  console.log('Seeding admin accounts...');

  // 1. Roles
  const roleRecords = [
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
  console.log('  Roles done.');

  // 2. Permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { idPermission: p.id },
      update: { namaAction: p.namaAction },
      create: { idPermission: p.id, namaAction: p.namaAction },
    });
  }
  console.log('  Permissions done.');

  // 3. Role-Permission mappings
  for (const [roleId, permIds] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permId of permIds) {
      await prisma.rolePermission.upsert({
        where: { idRole_idPermission: { idRole: roleId, idPermission: permId } },
        update: {},
        create: { idRole: roleId, idPermission: permId },
      });
    }
  }
  console.log('  Role-Permission mappings done.');

  // 4. Grades
  for (const g of GRADES) {
    await prisma.masterGrade.upsert({
      where: { idGrade: g.idGrade },
      update: { namaGrade: g.namaGrade },
      create: g,
    });
  }
  console.log('  Grades done.');

  // 5. Karyawan + Users + Kontrak
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const u of ADMIN_USERS) {
    // Karyawan
    await prisma.karyawan.upsert({
      where: { idKaryawan: u.idKaryawan },
      update: {
        idUser: u.idKaryawan,
        nama: u.nama,
        idGrade: u.idGrade,
        department: u.department,
        tanggalLahir: u.tanggalLahir,
        tanggalMasuk: u.tanggalMasuk,
      },
      create: {
        idKaryawan: u.idKaryawan,
        idUser: u.idKaryawan,
        nama: u.nama,
        idGrade: u.idGrade,
        department: u.department,
        tanggalLahir: u.tanggalLahir,
        tanggalMasuk: u.tanggalMasuk,
        tipeKontrak: 'PKWT',
        sisaCutiTahunan: 12,
        accrualRate: 1,
      },
    });

    // User
    await prisma.user.upsert({
      where: { idUser: u.idKaryawan },
      update: { email: u.email, idRole: u.role },
      create: {
        idUser: u.idKaryawan,
        email: u.email,
        idRole: u.role,
      },
    });

    // Kontrak (1 tahun dari sekarang)
    const kontrakId = `KTR-${u.idKaryawan}`;
    const tanggalMulai = new Date(todayStart);
    const tanggalBerakhir = new Date(todayStart);
    tanggalBerakhir.setFullYear(tanggalBerakhir.getFullYear() + 1);

    await prisma.kontrakKaryawan.upsert({
      where: { idKontrak: kontrakId },
      update: {
        idKaryawan: u.idKaryawan,
        tanggalMulai,
        tanggalBerakhir,
        carryOver: 6,
        annualQuota: 12,
        idStatus: 'ST_KON_ACTIVE',
      },
      create: {
        idKontrak: kontrakId,
        idKaryawan: u.idKaryawan,
        tanggalMulai,
        tanggalBerakhir,
        carryOver: 6,
        annualQuota: 12,
        idStatus: 'ST_KON_ACTIVE',
      },
    });
  }
  console.log('  Karyawan, Users, and Kontrak done.');

  console.log('Seeding admin selesai.');
  console.log('  HR Admin  : hradmin@amana.id');
  console.log('  Ops Admin : opsadmin@amana.id');
}

seedAdmins()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
