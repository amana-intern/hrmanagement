import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hrportal — feed pengumuman HR Portal (per-user).
// Feed: semua post aktif KECUALI yang sudah dicek oleh SAYA (centang hanya berdampak ke akun sendiri).
// Selain Admin HR → filter visibility (Bagian 1 design.md) + (audience=ALL OR row recipient) + belum dismiss.
// ?archive=1 → archive pribadi: post yang SAYA centang (semua role boleh akses).
// Sort: tanggalMulai desc (null last), lalu createdAt desc. Cap 50 item.
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const me = auth.idKaryawan;
    const canManage = auth.idRole === ROLES.ADMIN_HR;
    const wantArchive = new URL(request.url).searchParams.get('archive') === '1';
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const include = {
      states: { where: { idKaryawan: me } },
      recipients: { where: { idKaryawan: me }, select: { idKaryawan: true } },
    };
    const orderBy = [
      { tanggalMulai: { sort: 'desc' as const, nulls: 'last' as const } },
      { createdAt: 'desc' as const },
    ];

    // Sembunyikan otomatis: end date lewat +30 hari.
    const retention = {
      OR: [
        { tanggalSelesai: null },
        { tanggalSelesai: { gte: cutoff } },
      ],
    };

    const items = wantArchive
      ? await prisma.mading.findMany({
          where: { states: { some: { idKaryawan: me, isDone: true } } },
          include,
          orderBy,
          take: 50,
        })
      : canManage
        ? await prisma.mading.findMany({
            where: {
              AND: [
                retention,
                // Keluar dari feed hanya jika SAYA yang mencentang.
                { states: { none: { idKaryawan: me, isDone: true } } },
              ],
            },
            include,
            orderBy,
            take: 50,
          })
        : await prisma.mading.findMany({
            where: {
              AND: [
                // Schedule: tanggalMulai di masa depan → belum tampil.
                { OR: [{ tanggalMulai: null }, { tanggalMulai: { lte: now } }] },
                retention,
                { states: { none: { idKaryawan: me, isDone: true } } },
                // Visibility audience: ALL (dinamis) ATAU saya penerima.
                {
                  OR: [
                    { audience: { not: 'TARGETED' } },
                    { recipients: { some: { idKaryawan: me } } },
                  ],
                },
                // Dismiss per-user → sembunyi dari feed saya.
                { states: { none: { idKaryawan: me, isDismissed: true } } },
              ],
            },
            include,
            orderBy,
            take: 50,
          });

    const list = items.map((m) => ({
      idMading: m.idMading,
      judul: m.judul,
      pesan: m.pesan,
      link: m.link,
      audience: m.audience ?? 'ALL',
      tanggalMulai: m.tanggalMulai,
      tanggalSelesai: m.tanggalSelesai,
      isDone: m.states[0]?.isDone ?? false,
      doneAt: m.states[0]?.doneAt ?? null,
      createdAt: m.createdAt,
      isAuthor: m.createdBy === me,
      isRecipient: m.recipients.length > 0,
      isRead: m.states[0]?.isRead ?? false,
    }));

    const unread = list.filter((x) => !x.isAuthor && !x.isRead).length;
    return Response.json({ canManage, unread, list });
  } catch (e) {
    console.error('HR Portal GET error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// POST /api/hrportal — publish pengumuman (hanya Admin HR).
// Body: { judul, pesan, audience, tanggalMulai?, tanggalSelesai?, recipientIds?: string[] }
// TARGETED wajib recipientIds non-kosong; tanggalSelesai >= tanggalMulai.
// Tanpa Notification/email — pengumuman hanya muncul di feed HR Portal.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
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

    const idMading = `MAD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const cleanRecipients: string[] = isTargeted
      ? [...new Set<string>((recipientIds as unknown[]).map((v) => String(v)))]
      : [];

    await prisma.$transaction(async (tx) => {
      await tx.mading.create({
        data: {
          idMading,
          judul: cleanJudul || null,
          pesan: cleanPesan || null,
          link: cleanLink,
          audience: isTargeted ? 'TARGETED' : 'ALL',
          tanggalMulai: start,
          tanggalSelesai: end,
          createdBy: auth.idKaryawan,
        },
      });
      if (cleanRecipients.length > 0) {
        await tx.madingRecipient.createMany({
          data: cleanRecipients.map((idKaryawan) => ({ idMading, idKaryawan })),
          skipDuplicates: true,
        });
      }
    });

    return Response.json({ ok: true, idMading }, { status: 201 });
  } catch (e) {
    console.error('HR Portal POST error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
