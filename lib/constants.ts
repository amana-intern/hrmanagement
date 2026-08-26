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

// MasterStatus — cuti — label tampilan.
export const LEAVE_STATUS_LABELS: Record<string, string> = {
  [LEAVE_STATUS.PENDING]: 'Pending',
  [LEAVE_STATUS.APPROVED]: 'Approved',
  [LEAVE_STATUS.REJECTED]: 'Rejected',
};

// MasterStatus — payment request
export const PAYMENT_STATUS = {
  PENDING_OPS: 'ST_PAY_PENDING_OPS',
  PENDING_PARTNER: 'ST_PAY_PENDING_PARTNER',
  APPROVED: 'ST_PAY_APPROVED',
  REJECTED: 'ST_PAY_REJECTED',
  SCHEDULED: 'ST_PAY_SCHEDULED',
  PAID: 'ST_PAY_PAID',
} as const;

// MasterStatus — payment request — label & warna badge tampilan (dipakai oleh
// halaman OPS & Partner agar status yang sama selalu tampil sama).
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING_OPS]: 'Pending Ops',
  [PAYMENT_STATUS.PENDING_PARTNER]: 'Pending Partner',
  [PAYMENT_STATUS.REJECTED]: 'Rejected',
  [PAYMENT_STATUS.APPROVED]: 'Approved',
  [PAYMENT_STATUS.SCHEDULED]: 'Scheduled',
  [PAYMENT_STATUS.PAID]: 'Paid',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING_OPS]: 'bg-amana-warning-500',
  [PAYMENT_STATUS.PENDING_PARTNER]: 'bg-amana-primary-500',
  [PAYMENT_STATUS.REJECTED]: 'bg-amana-danger-500',
  [PAYMENT_STATUS.APPROVED]: 'bg-amana-success-500',
  [PAYMENT_STATUS.SCHEDULED]: 'bg-amana-primary-500',
  [PAYMENT_STATUS.PAID]: 'bg-amana-neutral-400',
};

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
} as const;

export const ASSESSMENT_QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  checkbox: 'Checkbox',
  short_answer: 'Short Answer',
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
  digital: 'Digital & Finance',
  education: 'Education & HR',
  ops: 'Operations',
};
