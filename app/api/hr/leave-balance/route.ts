import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { computeLeaveBalance } from '@/lib/leave';

// GET: Rekap sisa cuti seluruh karyawan (khusus HR)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const list = await prisma.karyawan.findMany({
      include: {
        masterGrade: true,
        user: { include: { role: true } },
        pengajuanCuti: true,
      },
      orderBy: { nama: 'asc' },
    });

    const result = [];
    for (const k of list) {
      const b = await computeLeaveBalance(k.idKaryawan);
      result.push({
        idKaryawan: k.idKaryawan,
        nama: k.nama,
        grade: k.masterGrade?.namaGrade ?? '-',
        department: k.department ?? '-',
        roleLabel: k.user?.role?.namaRole ?? '-',
        carryOver: b.carryOver,
        accrued: b.accrued,
        consumed: b.consumed,
        sisaCuti: b.sisa,
        annual: b.annualQuota,
        absensi: (k.pengajuanCuti ?? []).length,
      });
    }

    return Response.json({ list: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}