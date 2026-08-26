import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hr/talent-roster/[idKaryawan]/history — Career History (AuditTrail) karyawan, terbaru dulu.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ idKaryawan: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { idKaryawan } = await ctx.params;

    const history = await prisma.auditTrail.findMany({
      where: { idKaryawan },
      orderBy: { waktu: 'desc' },
    });

    return Response.json({
      list: history.map((h) => ({
        idAudit: h.idAudit,
        aktorNama: h.aktorNama,
        waktu: h.waktu,
        perubahan: h.perubahan as { field: string; from: string; to: string }[] | null,
      })),
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
