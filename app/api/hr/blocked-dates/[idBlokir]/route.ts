import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// DELETE /api/hr/blocked-dates/[idBlokir] — hapus tanggal diblokir (Admin HR)
export async function DELETE(_request: Request, ctx: { params: Promise<{ idBlokir: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { idBlokir } = await ctx.params;

    const existing = await prisma.tanggalBlokir.findUnique({ where: { idBlokir } });
    if (!existing) {
      return Response.json({ error: 'Tanggal tidak ditemukan' }, { status: 404 });
    }

    await prisma.tanggalBlokir.delete({ where: { idBlokir } });
    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}