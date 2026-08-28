export const ROLES = {
  EMPLOYEE: 'ROLE_EMPLOYEE',
  PARTNER: 'ROLE_PARTNER',
  ADMIN_HR: 'ROLE_ADMIN_HR',
  ADMIN_OPS: 'ROLE_ADMIN_OPS',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Custom role yang diinput HR saat menambah karyawan diperlakukan sebagai
// Employee. Hanya Partner / Admin HR / Admin OPS yang bukan karyawan.
export function isEmployeeRole(role?: string | null): boolean {
  if (!role) return false;
  return role !== ROLES.PARTNER && role !== ROLES.ADMIN_HR && role !== ROLES.ADMIN_OPS;
}

// Admin HR/OPS are also staff and use employee self-service features themselves
// (assessment, leave, sick leave, payment requests, CV, certificates) — only Partner
// is a pure external approver with no employee record of their own.
export function canUseEmployeeFeatures(role?: string | null): boolean {
  if (!role) return false;
  return role !== ROLES.PARTNER;
}

// Home route bagi tiap role setelah login
export const ROLE_HOME: Record<Role, string> = {
  [ROLES.EMPLOYEE]: '/user/profile',
  [ROLES.PARTNER]: '/partner/profile',
  [ROLES.ADMIN_HR]: '/hr/profile',
  [ROLES.ADMIN_OPS]: '/ops/profile',
};

// Daftar prefix route yang boleh diakses tiap role (route group)
// Admin HR/OPS juga boleh mengakses sisi user (cuti, sakit, assessment, careerhub)
// karena mereka bagian dari karyawan. Prefix /user memangku semua; bila perlu
// pembatasan spesifik (mis. hindari /user/payment), cek per-halaman.
export const ROLE_ROUTES: Record<Role, string[]> = {
  [ROLES.EMPLOYEE]: ['/user'],
  [ROLES.PARTNER]: ['/partner', '/user'],
  [ROLES.ADMIN_HR]: ['/hr', '/user'],
  [ROLES.ADMIN_OPS]: ['/ops', '/user'],
};

export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.PARTNER]: 'Partner',
  [ROLES.ADMIN_HR]: 'Admin HR',
  [ROLES.ADMIN_OPS]: 'Admin OPS',
};

// Pemetaan department -> tampilan label (untuk display "Partner · Health" dll)
export const DEPARTMENT_LABEL: Record<string, string> = {
  health: 'Health & Wellbeing',
  strategy: 'Strategy and Transformation',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

/**
 * label grade untuk ROW 1 di profil.
 * Contoh: grade = "PARTNER" -> "Partner"
 *         grade = "HEAD"    -> "Head of Operations"
 *         grade = "Associate"-> "Associate"
 */
export function buildGradeLabel(grade?: string | null, _department?: string | null): string {
  if (!grade) return 'No Grade';

  const lower = grade.toLowerCase();
  if (lower === 'partner') return 'Partner';
  if (lower === 'head') return 'Head of Operations';
  return grade;
}
