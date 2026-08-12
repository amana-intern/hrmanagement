import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// PATCH /api/notifications/[idNotif] — tandai satu notifikasi sudah dibaca
export async function PATCH(_request: Request, ctx: { params: Promise<{ idNotif: string }> }) {
  try {
    const auth = await requireAuth();
    const { idNotif } = await ctx.params;
    if (!auth.idKaryawan) {
      return Response.json({ ok: true });
    }
    await prisma.notification.updateMany({
      where: { idNotif, idKaryawan: auth.idKaryawan },
      data: { isRead: true },
    });
    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}