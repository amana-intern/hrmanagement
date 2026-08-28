import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { isEmployeeRole, ROLES } from '@/lib/roles';

// GET: daftar pengajuan cuti sesuai role (untuk PARTNER juga disertakan izin sakit dari pilar yang sama, view-only)
// - PARTNER: hanya cuti + izin sakit dari karyawan di department yang sama (pilar)
// - EMPLOYEE: hanya cuti milik sendiri
// - ADMIN_HR / ADMIN_OPS: semua (view)
export async function GET() {
  try {
    const auth = await requireAuth();

    const where: Record<string, unknown> = {};

    if (auth.idRole === ROLES.PARTNER) {
      const depts = auth.departments.length ? auth.departments : [auth.department ?? ''];
      where.karyawan = { department: { in: depts } };
    } else if (isEmployeeRole(auth.idRole)) {
      where.idKaryawan = auth.idKaryawan ?? undefined;
    }

    const list = await prisma.pengajuanCuti.findMany({
      where,
      include: {
        karyawan: { include: { masterGrade: true } },
        masterJenisCuti: true,
        masterStatus: true,
      },
      orderBy: { tanggalMulai: 'desc' },
    });

    // PARTNER: sertakan izin sakit satu pilar (view-only, tanpa status approval).
    let sickList: unknown[] = [];
    if (auth.idRole === ROLES.PARTNER) {
      const depts = auth.departments.length ? auth.departments : [auth.department ?? ''];
      sickList = (await prisma.izinSakit.findMany({
        where: {
          karyawan: { department: { in: depts } },
        },
        include: { karyawan: { include: { masterGrade: true } } },
        orderBy: { tanggalMulai: 'desc' },
      })) as unknown[];
    }

    return Response.json({ list, sickList });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
