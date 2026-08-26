import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { sendEmail } from '@/lib/notify';

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
      include: { karyawan: { include: { user: true } } },
    });
    if (!payment) return Response.json({ error: 'Not found' }, { status: 404 });

    const idKaryawan = payment.karyawan?.idKaryawan ?? null;
    const applicantEmail = payment.karyawan?.user?.email ?? null;
    const sendNotifEmail = (subject: string, text: string) =>
      applicantEmail ? sendEmail({ to: applicantEmail, subject, text }) : Promise.resolve();
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
          return Response.json({ error: 'Invalid status' }, { status: 409 });
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
                'Ops review passed',
                `Your payment request ${id} has passed the Ops review and is waiting for final Partner approval.`
              ),
            });
          }
          return u;
        });
        await sendNotifEmail(
          'Ops review passed',
          `Your payment request ${id} has passed the Ops review and is waiting for final Partner approval.`
        );
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'schedule') {
        if (payment.idStatus !== 'ST_PAY_APPROVED') {
          return Response.json({ error: 'Invalid status' }, { status: 409 });
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
                'Payment schedule',
                `Your payment request ${id} is scheduled to be paid on ${tanggal.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
              ),
            });
          }
          return u;
        });
        await sendNotifEmail(
          'Payment schedule',
          `Your payment request ${id} is scheduled to be paid on ${tanggal.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
        );
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'paid') {
        if (payment.idStatus !== 'ST_PAY_SCHEDULED') {
          return Response.json({ error: 'Invalid status' }, { status: 409 });
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
              data: notifData('PAY_PAID', 'Payment completed', `Your payment request ${id} has been paid in full.`),
            });
          }
          return u;
        });
        await sendNotifEmail('Payment completed', `Your payment request ${id} has been paid in full.`);
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'reject') {
        if (!catatan) {
          return Response.json({ error: 'Rejection reason is required' }, { status: 400 });
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
              data: notifData('PAY_REJECTED', 'Payment request rejected', `Your payment request ${id} was rejected. Reason: ${catatan}`),
            });
          }
          return u;
        });
        await sendNotifEmail('Payment request rejected', `Your payment request ${id} was rejected. Reason: ${catatan}`);
        return Response.json({ ok: true, payment: updated });
      }
      return Response.json({ error: 'Invalid action for OPS' }, { status: 400 });
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
              data: notifData('PAY_APPROVED', 'Payment request approved', `Your payment request ${id} has been approved and is waiting for a payment schedule.`),
            });
          }
          return u;
        });
        await sendNotifEmail(
          'Payment request approved',
          `Your payment request ${id} has been approved and is waiting for a payment schedule.`
        );
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'reject' && payment.idStatus === 'ST_PAY_PENDING_PARTNER') {
        if (!catatan) {
          return Response.json({ error: 'Rejection reason is required' }, { status: 400 });
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
              data: notifData('PAY_REJECTED', 'Payment request rejected', `Your payment request ${id} was rejected. Reason: ${catatan}`),
            });
          }
          return u;
        });
        await sendNotifEmail('Payment request rejected', `Your payment request ${id} was rejected. Reason: ${catatan}`);
        return Response.json({ ok: true, payment: updated });
      }
      return Response.json({ error: 'Invalid action for Partner' }, { status: 400 });
    }

    return Response.json({ error: 'Forbidden' }, { status: 403 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
