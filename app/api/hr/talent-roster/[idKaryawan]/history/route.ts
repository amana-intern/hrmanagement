import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hr/talent-roster/[idKaryawan]/history — HR melihat histori jenjang karir karyawan
// dari tabel KaryawanHistory. Format response sama dengan /api/me/career-history.
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ idKaryawan: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { idKaryawan } = await ctx.params;

    const list = await prisma.karyawanHistory.findMany({
      where: { idKaryawan },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      list: list.map((h) => ({
        id: h.idHistory,
        aktor: h.diubahOleh,
        waktu: h.createdAt,
        changes: [
          { field: h.tipe ?? '-', from: h.nilaiLama ?? '-', to: h.nilaiBaru ?? '-' },
        ],
      })),
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
