import 'server-only';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ROLES, type Role } from '@/lib/roles';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Memverifikasi sesi dan mengambil data user + karyawan + role.
 * Melempar AuthError jika tidak login.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.idUser) {
    throw new AuthError('Unauthorized', 401);
  }

  const user = await prisma.user.findUnique({
    where: { idUser: session.idUser },
    include: {
      role: {
        include: { rolePermissions: true },
      },
      karyawan: { include: { masterGrade: true } },
    },
  });

  if (!user) throw new AuthError('User not found', 401);

  return {
    idUser: user.idUser,
    idRole: (user.idRole ?? '') as Role,
    roleName: user.role?.namaRole ?? null,
    idKaryawan: user.karyawan?.idKaryawan ?? null,
    email: user.email ?? '',
    nama: user.karyawan?.nama ?? user.email,
    grade: user.karyawan?.masterGrade?.namaGrade ?? null,
    department: user.karyawan?.department ?? null,
    noTelepon: user.karyawan?.noTelepon ?? null,
    rolePermissions: user.role?.rolePermissions.map((rp) => rp.idPermission) ?? [],
  };
}

/** Helper untuk memastikan user punya role tertentu. */
export function requiresRole(role: Role, userRole: Role, allowPartner = false) {
  if (userRole === role) return;
  if (allowPartner && userRole === ROLES.PARTNER) return;
  throw new AuthError('Forbidden', 403);
}

/** Ambil semua pengguna 'approver' untuk department tertentu (partner pilar). */
export function partnerForDepartment(department: string | null) {
  // Partner pilar: role PARTNER dengan grade PARTNER (health/digital/education)
  // Head Ops: role PARTNER dengan grade HEAD (ops)
  if (department === 'ops') {
    return prisma.user.findMany({
      where: { idRole: ROLES.PARTNER, karyawan: { masterGrade: { namaGrade: 'Head' } } },
    });
  }
  return prisma.user.findMany({
    where: {
      idRole: ROLES.PARTNER,
      karyawan: { department, masterGrade: { namaGrade: 'Partner' } },
    },
  });
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}