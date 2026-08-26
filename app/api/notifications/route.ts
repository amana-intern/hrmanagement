import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - daftar notifikasi user (belum dibaca dulu, lalu sisanya).
// Sekaligus membersihkan notifikasi berumur lebih dari 7 hari (auto-delete).
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ notifications: [], unread: 0 });
    }

    // Auto-delete: notifikasi berumur > 7 hari dihapus permanen.
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } });

    const notifications = await prisma.notification.findMany({
      where: { idKaryawan: auth.idKaryawan },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const unread = notifications.filter((n) => !n.isRead).length;
    return Response.json({
      notifications: notifications.map((n) => ({
        idNotif: n.idNotif,
        tipe: n.tipe,
        judul: n.judul,
        pesan: n.pesan,
        idReferensi: n.idReferensi,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unread,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// PATCH /api/notifications - tandai semua sudah dibaca
export async function PATCH() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ ok: true });
    }
    await prisma.notification.updateMany({
      where: { idKaryawan: auth.idKaryawan, isRead: false },
      data: { isRead: true },
    });
    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
