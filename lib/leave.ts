import { prisma } from '@/lib/prisma';

export const PAID_LEAVE_JENIS = 'JC01'; // Paid Leave
export const LEAVE_APPROVED = 'ST_LEAVE_APPROVED';
const CARRY_OVER_MAX = 6; // n/2 dengan annualQuota = 12

// Parsing "YYYY-MM-DD" menjadi Date di UTC midnight.
// Kolom tanggal Prisma (`@db.Date`, `@db.Timestamp`) disimpan/dibaca sebagai UTC,
// jadi tanggal harus dibangun di UTC agar tersimpan & dibandingkan dengan benar
// (local midnight bisa bergeser ±jam dan menggeser tanggal ke hari sebelumnya).
export function parseDateOnly(v: string | null | undefined): Date | null {
  if (!v) return null;
  const parts = v.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(Date.UTC(y, m - 1, d));
}

export interface Period {
  start: Date;
  end: Date;
  carryOver: number;
  annualQuota: number;
}

// 1 hari per bulan sejak awal periode, dibatasi kuota tahunan.
// Bulan dihitung berdasarkan "tanggal ulang bulan" (anniversary).
// Join 13 Jul 2026 -> 13 Jul = 1, 12 Agu = 1, 13 Agu = 2, dst (cap quota).
export function accruedMonths(periodStart: Date, now: Date, quota: number): number {
  let months =
    (now.getFullYear() - periodStart.getFullYear()) * 12 +
    now.getMonth() -
    periodStart.getMonth();
  if (now.getDate() < periodStart.getDate()) months -= 1;
  return Math.min(Math.max(months + 1, 0), quota);
}

// Periode kontrak aktif (yang mencakup hari ini); fallback dari tanggal masuk.
export function resolvePeriod(
  tanggalMasuk: Date | null | undefined,
  contracts: ContractRow[] = []
): Period {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const ordered = [...contracts].sort(
    (a, b) => (a.tanggalMulai?.getTime() ?? 0) - (b.tanggalMulai?.getTime() ?? 0)
  );

  const active = ordered.find(
    (c) => c.tanggalMulai && c.tanggalBerakhir && todayStart >= c.tanggalMulai && todayStart <= c.tanggalBerakhir
  );

  const start = active?.tanggalMulai ?? tanggalMasuk ?? new Date();
  const end = active?.tanggalBerakhir ?? todayStart;

  return {
    start,
    end,
    carryOver: active?.carryOver ?? 0,
    annualQuota: active?.annualQuota ?? 12,
  };
}

export type ContractRow = {
  tanggalMulai: Date | null;
  tanggalBerakhir: Date | null;
  carryOver: number | null;
  annualQuota: number | null;
};

// Total hari cuti PAID yang sudah disetujui dalam rentang tanggal.
// Opsi includeFuture = true: hitung tanpa batas atas (end), agar cuti approved di masa depan
// langsung mengurangi saldo. Default false tetap membatasi pada [start, end] (dipakai carry-over & renewal).
export async function consumedDays(
  idKaryawan: string,
  start: Date,
  end: Date,
  opts: { includeFuture?: boolean } = {}
): Promise<number> {
  const rows = await prisma.pengajuanCuti.findMany({
    where: {
      idKaryawan,
      idJenisCuti: PAID_LEAVE_JENIS,
      idStatus: LEAVE_APPROVED,
      tanggalMulai: opts.includeFuture ? { gte: start } : { gte: start, lte: end },
    },
  });
  return rows.reduce((s, r) => s + (r.jumlahHari ?? 0), 0);
}

export interface LeaveBalance {
  sisa: number;
  accrued: number;
  consumed: number;
  carryOver: number;
  annualQuota: number;
  period: Period;
}

// Hitung saldo dari data (selalu up-to-date terhadap tanggal & pengajuan).
export async function computeLeaveBalance(idKaryawan: string): Promise<LeaveBalance> {
  const k = await prisma.karyawan.findUnique({
    where: { idKaryawan },
    include: { kontrakKaryawan: true },
  });
  if (!k) {
    return { sisa: 0, accrued: 0, consumed: 0, carryOver: 0, annualQuota: 12, period: { start: new Date(), end: new Date(), carryOver: 0, annualQuota: 12 } };
  }

  const contracts: ContractRow[] = k.kontrakKaryawan
    .filter((c) => c.tanggalMulai)
    .map((c) => ({
      tanggalMulai: c.tanggalMulai,
      tanggalBerakhir: c.tanggalBerakhir,
      carryOver: c.carryOver,
      annualQuota: c.annualQuota,
    }));

  const period = resolvePeriod(k.tanggalMasuk, contracts);
  const consumed = await consumedDays(idKaryawan, period.start, period.end, { includeFuture: true });
  const accrued = accruedMonths(period.start, new Date(), period.annualQuota);
  const sisa = Math.max(period.carryOver + accrued - consumed, 0);

  return { sisa, accrued, consumed, carryOver: period.carryOver, annualQuota: period.annualQuota, period };
}

// Persist hasil hitung ke kolom sisaCutiTahunan utk pembacaan cepat & tampilan HR.
export async function persistLeaveBalance(idKaryawan: string): Promise<number> {
  const { sisa } = await computeLeaveBalance(idKaryawan);
  await prisma.karyawan.update({
    where: { idKaryawan },
    data: { sisaCutiTahunan: sisa },
  });
  return sisa;
}

// Aturan n/2: carry-over = min(sisa periode berakhir, 6). Dipakai saat kontrak baru dibuat.
export async function computeCarryOver(
  idKaryawan: string,
  previousEnd: Date,
  previousQuota: number = 12
): Promise<number> {
  const prevStart = new Date(previousEnd.getFullYear(), 0, 1);
  const consumed = await consumedDays(idKaryawan, prevStart, previousEnd);
  const accrued = accruedMonths(prevStart, previousEnd, previousQuota);
  const remaining = Math.max(accrued - consumed, 0);
  return Math.min(remaining, CARRY_OVER_MAX);
}