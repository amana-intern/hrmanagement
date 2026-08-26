import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { persistLeaveBalance } from '@/lib/leave';
import { sendEmail } from '@/lib/notify';

// PATCH /api/leave/[id] — Partner approve/reject cuti (pilar department).
// Matriks approver (Fitur 9):
//  - Karyawan biasa        -> Partner pilar department yang sama
//  - Admin HR              -> Partner Education & HR (department 'education')
//  - Admin OPS             -> Head Ops (department 'ops')
// Body: { action: 'approve' | 'reject', catatan?: string }
// Reject wajib mengisi catatan/alasan (tersimpan di ApprovalHistory + PengajuanCuti.catatan),
// dan pemohon menerima notifikasi hasil persetujuan.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    const { id } = await ctx.params;

    if (auth.idRole !== ROLES.PARTNER) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body || {};
    const catatan = String(body?.catatan ?? '').trim() || null;
    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (action === 'reject' && !catatan) {
      return Response.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const cuti = await prisma.pengajuanCuti.findUnique({
      where: { idCuti: id },
      include: { karyawan: { include: { user: true } } },
    });

    if (!cuti) return Response.json({ error: 'Request not found' }, { status: 404 });

    // Verifikasi pilar: partner hanya approve cuti di department yang sama.
    // Admin HR/OPS yang mengajukan punya department masing-masing
    // (Admin HR -> education, Admin OPS -> ops), sehingga sesuai matriks.
    if (cuti.karyawan?.department !== auth.department) {
      return Response.json({ error: 'Not your department' }, { status: 403 });
    }

    const newStatus = action === 'approve' ? 'ST_LEAVE_APPROVED' : 'ST_LEAVE_REJECTED';

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.pengajuanCuti.update({
        where: { idCuti: id },
        data: {
          idStatus: newStatus,
          disetujuiOleh: auth.idUser,
          tanggalApproval: new Date(),
          catatan,
        },
      });

      await tx.approvalHistory.create({
        data: {
          idHistory: `HIST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          idReferensi: id,
          modul: 'LEAVE',
          actorIdUser: auth.idUser,
          action,
          catatan,
        },
      });

      // Notifikasi ke pemohon
      if (cuti.karyawan?.idKaryawan) {
        await tx.notification.create({
          data: {
            idNotif: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            idKaryawan: cuti.karyawan.idKaryawan,
            tipe: action === 'approve' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
            judul: action === 'approve' ? 'Leave approved' : 'Leave rejected',
            pesan:
              action === 'approve'
                ? `Your leave request (${cuti.tanggalMulai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${cuti.tanggalSelesai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}) has been approved.`
                : `Your leave request (${cuti.tanggalMulai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${cuti.tanggalSelesai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}) was rejected. Reason: ${catatan}`,
            idReferensi: id,
          },
        });
      }

      return u;
    });

    // Approved -> kurangi saldo otomatis
    if (action === 'approve' && cuti.karyawan?.idKaryawan) {
      await persistLeaveBalance(cuti.karyawan.idKaryawan);
    }

    // Email notifikasi hasil persetujuan ke pemohon (isi sama dengan bell).
    const applicantEmail = cuti.karyawan?.user?.email;
    if (applicantEmail) {
      const subject = action === 'approve' ? 'Leave approved' : 'Leave rejected';
      const range = `${cuti.tanggalMulai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${cuti.tanggalSelesai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      const text =
        action === 'approve'
          ? `Hello ${cuti.karyawan.nama ?? 'Employee'},\n\nYour leave request (${range}) has been approved.\n\nThank you.`
          : `Hello ${cuti.karyawan.nama ?? 'Employee'},\n\nYour leave request (${range}) was rejected.\nReason: ${catatan}\n\nThank you.`;
      await sendEmail({ to: applicantEmail, subject, text });
    }

    return Response.json({ ok: true, cuti: updated });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
