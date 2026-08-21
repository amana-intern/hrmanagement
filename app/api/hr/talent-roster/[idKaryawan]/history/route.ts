import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hr/talent-roster/[idKaryawan]/history — HR melihat histori jenjang karir karyawan.
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

    return Response.json({ list });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
