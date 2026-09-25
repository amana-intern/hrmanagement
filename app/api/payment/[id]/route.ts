import { NextRequest } from 'next/server';
import { requireAuth, partnerForDepartment } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { sendEmail, notifyAllOpsAdmins, notifyUsers } from '@/lib/notify';
import { completeTodo } from '@/lib/todos';
import { todayISOWIB } from '@/lib/constants';

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
        // Buat to-do + notifikasi bell/email untuk partner di department yang sama
        const empDept = payment.karyawan?.department;
        if (empDept) {
          const partners = await partnerForDepartment(empDept);
          await notifyUsers(
            partners
              .filter((p) => p.idUser !== auth.idUser && p.karyawan?.idKaryawan)
              .map((p) => ({ idKaryawan: p.karyawan?.idKaryawan, email: p.email })),
            {
              tipe: 'PAY_PENDING_PARTNER',
              judul: 'Payment awaiting Partner approval',
              pesan: `Payment request ${id} from ${payment.karyawan?.nama ?? 'an employee'} has passed Ops review and is waiting for your final approval.`,
              idReferensi: id,
            }
          );
          for (const partner of partners) {
            if (partner.karyawan?.idKaryawan) {
              await prisma.hrTodo.create({
                data: {
                  idTodo: `TODO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  idKaryawan: partner.karyawan.idKaryawan,
                  teks: `Review payment ${payment.karyawan?.nama ?? '-'}`,
                  modul: 'PAYMENT',
                  idReferensi: id,
                },
              });
            }
          }
        }
        // To-do OPS "Review payment…" (dibuat saat submit) selesai setelah review/reject
        await completeTodo('PAYMENT_REVIEW', id);
        return Response.json({ ok: true, payment: updated });
      }
      if (action === 'schedule') {
        if (payment.idStatus !== 'ST_PAY_APPROVED') {
          return Response.json({ error: 'Invalid status' }, { status: 409 });
        }
        if (tanggalPembayaran && String(tanggalPembayaran).slice(0, 10) < todayISOWIB()) {
          return Response.json({ error: 'Payment schedule date cannot be in the past.' }, { status: 400 });
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
        // To-do OPS "Schedule payment…" selesai setelah schedule
        await completeTodo('PAYMENT_SCHEDULE', id);
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
        if (payment.idStatus !== 'ST_PAY_PENDING_OPS') {
          return Response.json({ error: 'Invalid status' }, { status: 409 });
        }
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
        // To-do OPS "Review payment…" selesai setelah reject
        await completeTodo('PAYMENT_REVIEW', id);
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
        // Beri tahu semua Admin OPS + to-do "Schedule payment" (bersamaan)
        await notifyAllOpsAdmins({
          tipe: 'PAY_WAITING_SCHEDULE',
          judul: 'Payment ready to schedule',
          pesan: `Payment request ${id} from ${payment.karyawan?.nama ?? 'an employee'} has been approved. Please schedule the payment.`,
          idReferensi: id,
          todo: {
            teks: `Schedule payment ${payment.karyawan?.nama ?? '-'} (${id})`,
            modul: 'PAYMENT_SCHEDULE',
          },
        });
        // To-do Partner selesai setelah final approve
        await completeTodo('PAYMENT', id);
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
        await completeTodo('PAYMENT', id);
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
