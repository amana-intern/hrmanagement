// Kode master terpusat (sinkron dengan prisma/seed.ts dan database).
// JANGAN menulis kode status/kategori sebagai string hardcoded di halaman/API —
// gunakan konstanta dari sini.

export const ROLES = {
  EMPLOYEE: 'ROLE_EMPLOYEE',
  PARTNER: 'ROLE_PARTNER',
  ADMIN_HR: 'ROLE_ADMIN_HR',
  ADMIN_OPS: 'ROLE_ADMIN_OPS',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// MasterJenisCuti
export const LEAVE_TYPES = {
  PAID: 'JC01',
  SPECIAL: 'JC02',
  UNPAID: 'JC03',
  COMPENSATORY: 'JC04',
} as const;

// MasterKategoriPayment
export const PAYMENT_KATEGORI = {
  VENDOR: 'KPY01',
  INDIVIDUAL: 'KPY02',
  PER_DIEM: 'KPY03',
} as const;

// MasterStatus — cuti
export const LEAVE_STATUS = {
  PENDING: 'ST_LEAVE_PENDING',
  APPROVED: 'ST_LEAVE_APPROVED',
  REJECTED: 'ST_LEAVE_REJECTED',
} as const;

// MasterStatus — payment request
export const PAYMENT_STATUS = {
  PENDING_OPS: 'ST_PAY_PENDING_OPS',
  PENDING_PARTNER: 'ST_PAY_PENDING_PARTNER',
  APPROVED: 'ST_PAY_APPROVED',
  REJECTED: 'ST_PAY_REJECTED',
  SCHEDULED: 'ST_PAY_SCHEDULED',
  PAID: 'ST_PAY_PAID',
} as const;

// MasterStatus — kontrak
export const CONTRACT_STATUS = {
  ACTIVE: 'ST_KON_ACTIVE',
  EXPIRING: 'ST_KON_EXPIRING',
  EXPIRED: 'ST_KON_EXPIRED',
} as const;

// MasterStatus — assessment
export const ASSESSMENT_STATUS = {
  OPEN: 'ST_ASM_OPEN',
  CLOSED: 'ST_ASM_CLOSED',
} as const;

// AssessmentQuestion.tipeSoal — null means the legacy fixed 1-4 proficiency-level question.
export const ASSESSMENT_QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  CHECKBOX: 'checkbox',
  SHORT_ANSWER: 'short_answer',
  CHECKBOX_GRID: 'checkbox_grid',
} as const;

export const ASSESSMENT_QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  checkbox: 'Checkbox',
  short_answer: 'Short Answer',
  checkbox_grid: 'Checkbox Grid',
};

// MasterStatus — talent
export const TALENT_STATUS = {
  PENDING: 'ST_TAL_PENDING',
  DONE: 'ST_TAL_DONE',
} as const;

// LowonganKarir (status bukan dari MasterStatus)
export const JOB_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

// Karyawan.department key -> display label.
export const DEPARTMENT_LABELS: Record<string, string> = {
  health: 'Health & Wellbeing',
  strategy: 'Strategy and Transformation',
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};

// Special Leave: batas hari per pengajuan diambil dari teks alasan, mis. "Marriage (Maximum of 3 days)" -> 3.
// Alasan "depends on company policy" tidak punya batas (null). Dipakai form cuti & API supaya aturannya satu sumber.
export function specialLeaveMaxDays(reason?: string | null): number | null {
  const m = reason?.match(/maximum of (\d+) day/i);
  return m ? Number(m[1]) : null;
}

export function specialLeaveName(reason: string): string {
  return reason.replace(/\s*\(.*\)\s*$/, '');
}

// Tanggal hari ini (YYYY-MM-DD) di zona WIB — batas minimum pemilihan tanggal pengajuan (cuti, sakit, jadwal payment).
export function todayISOWIB(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}
