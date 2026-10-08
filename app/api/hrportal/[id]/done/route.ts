import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// PATCH /api/hrportal/[id]/done — checklist per-user (arsip pribadi).
// Body: { done: boolean } — check (true) = post masuk ke archive akun saya;
// uncheck (false) = restore ke feed saya. Hanya menulis MadingUserState milik saya,
// sehingga centang saya TIDAK memengaruhi feed/archive akun lain.
// Guard: post TARGETED hanya boleh dicek penerima (post itu memang tidak terlihat utk non-penerima),
// kecuali Admin HR — feed HR menampilkan semua pengumuman.
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const me = auth.idKaryawan;
    const { id } = await ctx.params;

    const body = await request.json();
    if (typeof body?.done !== 'boolean') {
      return Response.json({ error: 'Invalid done value' }, { status: 400 });
    }
    const done = body.done as boolean;

    const mading = await prisma.mading.findUnique({ where: { idMading: id } });
    if (!mading) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }
    if (done && mading.audience === 'TARGETED' && auth.idRole !== ROLES.ADMIN_HR) {
      const recipient = await prisma.madingRecipient.findUnique({
        where: { idMading_idKaryawan: { idMading: id, idKaryawan: me } },
      });
      if (!recipient) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.madingUserState.upsert({
      where: { idMading_idKaryawan: { idMading: id, idKaryawan: me } },
      create: { idMading: id, idKaryawan: me, isDone: done, doneAt: done ? new Date() : null },
      update: { isDone: done, doneAt: done ? new Date() : null },
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('HR Portal done PATCH error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
