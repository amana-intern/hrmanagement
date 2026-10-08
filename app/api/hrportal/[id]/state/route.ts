import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// PATCH /api/hrportal/[id]/state — tandai read / dismiss milik saya (per-user).
// Body: { action: 'read' | 'dismiss' } → upsert MadingUserState.
// Hanya untuk Mading yang visible ke saya (audience rule + belum dijadwalkan).
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const me = auth.idKaryawan;
    const { id } = await ctx.params;

    const body = await request.json();
    const action = body?.action;
    if (action !== 'read' && action !== 'dismiss') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const mading = await prisma.mading.findUnique({ where: { idMading: id } });
    if (!mading) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }
    // Targeted: hanya penerima yang boleh menulis state — kecuali Admin HR
    // (feed HR menampilkan semua pengumuman, termasuk yang bukan ia penerima).
    if (mading.audience === 'TARGETED' && auth.idRole !== ROLES.ADMIN_HR) {
      const recipient = await prisma.madingRecipient.findUnique({
        where: { idMading_idKaryawan: { idMading: id, idKaryawan: me } },
      });
      if (!recipient) {
        return Response.json({ error: 'Announcement not found' }, { status: 404 });
      }
    }
    if (mading.tanggalMulai && mading.tanggalMulai > new Date()) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const now = new Date();
    const data =
      action === 'read'
        ? { isRead: true, readAt: now }
        : { isDismissed: true, dismissedAt: now };

    await prisma.madingUserState.upsert({
      where: { idMading_idKaryawan: { idMading: id, idKaryawan: me } },
      create: { idMading: id, idKaryawan: me, ...data },
      update: data,
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('HR Portal state PATCH error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
