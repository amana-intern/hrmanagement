import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hrportal/recipients — picker penerima announcement (Admin HR).
// Query: ?q= (search nama, insensitive), ?department= (filter pilar).
// roleLabel diambil dari User.role (bukan hardcode). Hanya karyawan yang punya akun login.
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const department = url.searchParams.get('department')?.trim() ?? '';

    const rows = await prisma.karyawan.findMany({
      where: {
        user: { isNot: null },
        ...(q ? { nama: { contains: q, mode: 'insensitive' } } : {}),
        ...(department
          ? { OR: [{ department }, { departments: { has: department } }] }
          : {}),
      },
      include: { user: { include: { role: true } } },
      orderBy: { nama: 'asc' },
    });

    return Response.json({
      list: rows.map((k) => ({
        idKaryawan: k.idKaryawan,
        nama: k.nama ?? '-',
        department: k.department ?? null,
        roleLabel: k.user?.role?.namaRole ?? '-',
        email: k.user?.email ?? null,
      })),
    });
  } catch (e) {
    console.error('HR Portal recipients GET error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
