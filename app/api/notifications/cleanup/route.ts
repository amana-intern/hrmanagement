import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// POST /api/notifications/cleanup - hapus notifikasi berumur > 7 hari.
// Dipisah dari GET /api/notifications supaya pembacaan lonceng tetap murni SELECT
// (sebelumnya tiap polling melakukan DELETE = write-on-read).
export async function POST() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ ok: true });
    }
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.notification.deleteMany({
      where: { idKaryawan: auth.idKaryawan, createdAt: { lt: cutoff } },
    });
    return Response.json({ ok: true, deleted: deleted.count });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
