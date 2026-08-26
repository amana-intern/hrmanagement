import { DEPARTMENT_LABELS } from '@/lib/constants';
import type { LeaveDetailRow } from '@/app/components/LeaveDetailModal';

export interface LeaveRaw {
  idCuti: string;
  karyawan?: { nama?: string | null; department?: string | null; masterGrade?: { namaGrade?: string | null } | null };
  masterJenisCuti?: { namaJenis?: string | null } | null;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  jumlahHari?: number | null;
  keterangan?: string | null;
  catatan?: string | null;
  tanggalPengajuan?: string | null;
  idStatus?: string | null;
}

const fmtDate = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('id-ID') : '-');

// Shared by the Leave Record (HR) and Leave Approval (Partner) tables — both
// build a LeaveDetailModal row from the same PengajuanCuti shape.
export function toLeaveDetailRow(c: LeaveRaw): LeaveDetailRow {
  const name = c.karyawan?.nama ?? '-';
  const department = (c.karyawan?.department && DEPARTMENT_LABELS[c.karyawan.department]) || c.karyawan?.department || '-';
  const grade = c.karyawan?.masterGrade?.namaGrade ?? '-';
  const type = c.masterJenisCuti?.namaJenis ?? 'Leave';
  const dates = `${fmtDate(c.tanggalMulai)} - ${fmtDate(c.tanggalSelesai)}`;
  return {
    idCuti: c.idCuti,
    name,
    department,
    grade,
    type,
    dates,
    jumlahHari: c.jumlahHari,
    tanggalPengajuan: c.tanggalPengajuan,
    keterangan: c.keterangan,
    catatan: c.catatan,
    jenis: 'cuti',
  };
}
