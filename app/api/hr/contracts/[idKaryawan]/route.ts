import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

const nota = () => `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// PATCH /api/hr/contracts/[idKaryawan] — Renewal / Offboarding oleh PARTNER (pilar dept).
// Aksi bersifat notifikasi ke HR & Karyawan (proses kontrak/meeting dilakukan manusia di luar sistem).
// Partner TIDAK mengubah data kontrak.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ idKaryawan: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.PARTNER) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { idKaryawan } = await ctx.params;
    const body = await request.json();
    const { action } = body || {};
    if (!['renewal', 'offboarding'].includes(action)) {
      return Response.json({ error: 'Action tidak valid' }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      include: { user: { include: { role: true } } },
    });
    if (!karyawan) return Response.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });

    // Guard pilar: Partner hanya bisa aksi utk karyawan di department yang sama
    if (karyawan.department !== auth.department) {
      return Response.json({ error: 'Bukan department Anda' }, { status: 403 });
    }

    // Cari user HR (role ADMIN_HR) utk notifikasi
    const hrUser = await prisma.user.findFirst({
      where: { idRole: ROLES.ADMIN_HR },
      include: { karyawan: true },
    });

    await prisma.$transaction(async (tx) => {
      const isRenewal = action === 'renewal';
      const pesan = isRenewal
        ? `Partner ${auth.nama} meminta renewal kontrak untuk ${karyawan.nama}. Mohon proses perpanjangan kontrak.`
        : `Partner ${auth.nama} meminta offboarding untuk ${karyawan.nama}. Mohon proses meeting offboarding.`;

      // Notifikasi ke Karyawan
      await tx.notification.create({
        data: {
          idNotif: nota(),
          idKaryawan,
          tipe: isRenewal ? 'CONTRACT_RENEWAL' : 'CONTRACT_OFFBOARDING',
          judul: isRenewal ? 'Renewal kontrak diminta' : 'Offboarding diminta',
          pesan,
          idReferensi: idKaryawan,
        },
      });

      // Notifikasi ke HR
      if (hrUser?.karyawan?.idKaryawan) {
        await tx.notification.create({
          data: {
            idNotif: nota(),
            idKaryawan: hrUser.karyawan.idKaryawan,
            tipe: isRenewal ? 'CONTRACT_RENEWAL' : 'CONTRACT_OFFBOARDING',
            judul: isRenewal ? 'Permintaan renewal kontrak' : 'Permintaan offboarding',
            pesan,
            idReferensi: idKaryawan,
          },
        });
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}