import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

const nota = () => `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const hist = () => `HIST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// PATCH /api/payment/[id] — transisi status sesuai peran
// - ADMIN_OPS:   review_approve / reject / schedule / paid
// - PARTNER:     final_approve / reject
// Setiap transisi dicatat di ApprovalHistory; reject wajib catatan;
// pemohon mendapat notifikasi di setiap tahap.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await ctx.params;
    const body = await request.json();
    const { action, tanggalPembayaran } = body || {};
    const catatan = String(body?.catatan ?? '').trim() || null;

    const payment = await prisma.paymentRequest.findUnique({
      where: { idRequest: id },
      include: { karyawan: true },
    });
    if (!payment) return Response.json({ error: 'Tidak ditemukan' }, { status: 404 });

    const idKaryawan = payment.karyawan?.idKaryawan ?? null;
    const notifData = (tipe: string, judul: string, pesan: string) => ({
      idNotif: nota(),
      idKaryawan,
      tipe,
      judul,
      pesan,
      idReferensi: id,
    });

    if (auth.idRole === ROLES.ADMIN_OPS) {
      if (action === 'review_approve') {
        if (payment.idStatus !== 'ST_PAY_PENDING_OPS') {
          return Response.json({ error: 'Status tidak sesuai' }, { status: 409 });
        }
        const updated = await prisma.$transaction(async (tx) => {
          const u = await tx.paymentRequest.update({
            where: { idRequest: id },
            data: {
              idStatus: 'ST_PAY_PENDING_PARTNER',
              disetujuiOleh: auth.idUser,
              tanggalApproval: new Date(),
            },
          });
          await tx.approvalHistory.create({
            data: { idHistory: hist(), idReferensi: id, modul: 'PAYMENT', actorIdUser: auth.idUser, action, catatan },
          });
          if (idKaryawan) {
            await tx.notification.create({
              data: notifData(
                'PAY_REVIEW_APPROVED',
                'Lolos review Ops',
                `Pengajuan dana ${id} Anda telah lolos review Ops dan menunggu persetujuan final Partner.`
              ),
            });
          }
          return u;
        });
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'schedule') {
        if (payment.idStatus !== 'ST_PAY_APPROVED') {
          return Response.json({ error: 'Status tidak sesuai' }, { status: 409 });
        }
        const tanggal = tanggalPembayaran ? new Date(tanggalPembayaran) : new Date();
        const updated = await prisma.$transaction(async (tx) => {
          const u = await tx.paymentRequest.update({
            where: { idRequest: id },
            data: { idStatus: 'ST_PAY_SCHEDULED', tanggalJadwalPembayaran: tanggal },
          });
          await tx.approvalHistory.create({
            data: { idHistory: hist(), idReferensi: id, modul: 'PAYMENT', actorIdUser: auth.idUser, action, catatan },
          });
          if (idKaryawan) {
            await tx.notification.create({
              data: notifData(
                'PAY_SCHEDULED',
                'Jadwal pembayaran',
                `Pengajuan dana ${id} dijadwalkan dibayar pada ${tanggal.toLocaleDateString('id-ID')}.`
              ),
            });
          }
          return u;
        });
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'paid') {
        if (payment.idStatus !== 'ST_PAY_SCHEDULED') {
          return Response.json({ error: 'Status tidak sesuai' }, { status: 409 });
        }
        const updated = await prisma.$transaction(async (tx) => {
          const u = await tx.paymentRequest.update({
            where: { idRequest: id },
            data: { idStatus: 'ST_PAY_PAID', tanggalLunas: new Date() },
          });
          await tx.approvalHistory.create({
            data: { idHistory: hist(), idReferensi: id, modul: 'PAYMENT', actorIdUser: auth.idUser, action, catatan },
          });
          if (idKaryawan) {
            await tx.notification.create({
              data: notifData('PAY_PAID', 'Pembayaran selesai', `Pengajuan dana ${id} Anda telah dibayar lunas.`),
            });
          }
          return u;
        });
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'reject') {
        if (!catatan) {
          return Response.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 });
        }
        const updated = await prisma.$transaction(async (tx) => {
          const u = await tx.paymentRequest.update({
            where: { idRequest: id },
            data: { idStatus: 'ST_PAY_REJECTED', disetujuiOleh: auth.idUser, tanggalApproval: new Date(), catatan },
          });
          await tx.approvalHistory.create({
            data: { idHistory: hist(), idReferensi: id, modul: 'PAYMENT', actorIdUser: auth.idUser, action, catatan },
          });
          if (idKaryawan) {
            await tx.notification.create({
              data: notifData('PAY_REJECTED', 'Pengajuan dana ditolak', `Pengajuan dana ${id} Anda ditolak. Alasan: ${catatan}`),
            });
          }
          return u;
        });
        return Response.json({ ok: true, payment: updated });
      }
      return Response.json({ error: 'Action tidak valid untuk OPS' }, { status: 400 });
    }

    if (auth.idRole === ROLES.PARTNER) {
      if (action === 'final_approve' && payment.idStatus === 'ST_PAY_PENDING_PARTNER') {
        const updated = await prisma.$transaction(async (tx) => {
          const u = await tx.paymentRequest.update({
            where: { idRequest: id },
            data: { idStatus: 'ST_PAY_APPROVED', disetujuiOleh: auth.idUser, tanggalApproval: new Date() },
          });
          await tx.approvalHistory.create({
            data: { idHistory: hist(), idReferensi: id, modul: 'PAYMENT', actorIdUser: auth.idUser, action, catatan },
          });
          if (idKaryawan) {
            await tx.notification.create({
              data: notifData('PAY_APPROVED', 'Pengajuan dana disetujui', `Pengajuan dana ${id} Anda telah disetujui dan menunggu jadwal pembayaran.`),
            });
          }
          return u;
        });
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'reject' && payment.idStatus === 'ST_PAY_PENDING_PARTNER') {
        if (!catatan) {
          return Response.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 });
        }
        const updated = await prisma.$transaction(async (tx) => {
          const u = await tx.paymentRequest.update({
            where: { idRequest: id },
            data: { idStatus: 'ST_PAY_REJECTED', disetujuiOleh: auth.idUser, tanggalApproval: new Date(), catatan },
          });
          await tx.approvalHistory.create({
            data: { idHistory: hist(), idReferensi: id, modul: 'PAYMENT', actorIdUser: auth.idUser, action, catatan },
          });
          if (idKaryawan) {
            await tx.notification.create({
              data: notifData('PAY_REJECTED', 'Pengajuan dana ditolak', `Pengajuan dana ${id} Anda ditolak. Alasan: ${catatan}`),
            });
          }
          return u;
        });
        return Response.json({ ok: true, payment: updated });
      }
      return Response.json({ error: 'Action tidak valid untuk Partner' }, { status: 400 });
    }

    return Response.json({ error: 'Forbidden' }, { status: 403 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}
