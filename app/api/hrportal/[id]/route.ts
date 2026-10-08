import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hrportal/[id] — detail announcement utk modal edit (Admin HR — semua akun, siapa pun pembuatnya).
// Return recipientIds penuh supaya form edit bisa prefill picker Targeted.
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const mading = await prisma.mading.findUnique({
      where: { idMading: id },
      include: { recipients: { select: { idKaryawan: true } } },
    });
    if (!mading) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return Response.json({
      judul: mading.judul,
      pesan: mading.pesan,
      link: mading.link,
      audience: mading.audience ?? 'ALL',
      tanggalMulai: mading.tanggalMulai,
      tanggalSelesai: mading.tanggalSelesai,
      recipientIds: mading.recipients.map((r) => r.idKaryawan),
    });
  } catch (e) {
    console.error('HR Portal detail GET error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// PATCH /api/hrportal/[id] — edit announcement (Admin HR — semua akun, siapa pun pembuatnya).
// Body sama dengan POST: { judul, pesan, audience, tanggalMulai?, tanggalSelesai?, recipientIds? }
// Validasi sama dengan POST; recipients diganti total (ALL → hapus semua recipient).
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const mading = await prisma.mading.findUnique({ where: { idMading: id } });
    if (!mading) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const body = await request.json();
    const { judul, pesan, link, audience, tanggalMulai, tanggalSelesai, recipientIds } = body || {};

    const cleanJudul = typeof judul === 'string' ? judul.trim() : '';
    const cleanPesan = typeof pesan === 'string' ? pesan.trim() : '';
    if (!cleanJudul && !cleanPesan) {
      return Response.json({ error: 'Title or message is required' }, { status: 400 });
    }

    // Link opsional: wajib tanpa spasi; auto-prefix https:// bila scheme tidak ditulis.
    const rawLink = typeof link === 'string' ? link.trim() : '';
    if (rawLink && /\s/.test(rawLink)) {
      return Response.json({ error: 'Invalid link' }, { status: 400 });
    }
    const cleanLink = rawLink ? (/^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`) : null;

    const isTargeted = audience === 'TARGETED';
    if (isTargeted && (!Array.isArray(recipientIds) || recipientIds.length === 0)) {
      return Response.json({ error: 'Recipients are required for targeted announcements' }, { status: 400 });
    }

    const start = tanggalMulai ? new Date(tanggalMulai) : null;
    const end = tanggalSelesai ? new Date(tanggalSelesai) : null;
    if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
      return Response.json({ error: 'Invalid date' }, { status: 400 });
    }
    if (start && end && end < start) {
      return Response.json({ error: 'End date must be on or after start date' }, { status: 400 });
    }

    const cleanRecipients: string[] = isTargeted
      ? [...new Set<string>((recipientIds as unknown[]).map((v) => String(v)))]
      : [];

    await prisma.$transaction(async (tx) => {
      await tx.mading.update({
        where: { idMading: id },
        data: {
          judul: cleanJudul || null,
          pesan: cleanPesan || null,
          link: cleanLink,
          audience: isTargeted ? 'TARGETED' : 'ALL',
          tanggalMulai: start,
          tanggalSelesai: end,
        },
      });
      await tx.madingRecipient.deleteMany({ where: { idMading: id } });
      if (cleanRecipients.length > 0) {
        await tx.madingRecipient.createMany({
          data: cleanRecipients.map((idKaryawan) => ({ idMading: id, idKaryawan })),
          skipDuplicates: true,
        });
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error('HR Portal PATCH error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// DELETE /api/hrportal/[id] — hard delete pengumuman (Admin HR — semua akun, siapa pun pembuatnya).
// Cascade menghapus MadingRecipient + MadingUserState.
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const mading = await prisma.mading.findUnique({ where: { idMading: id } });
    if (!mading) {
      return Response.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await prisma.mading.delete({ where: { idMading: id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('HR Portal DELETE error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
