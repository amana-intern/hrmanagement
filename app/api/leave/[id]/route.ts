import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { LEAVE_TYPES } from '@/lib/constants';
import { persistLeaveBalance, computeLeaveBalance } from '@/lib/leave';
import { sendEmail } from '@/lib/notify';
import { completeTodo } from '@/lib/todos';

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

    // Cek apakah applicant adalah partner (sudah auto-approved)
    const applicantKaryawan = await prisma.karyawan.findUnique({
      where: { idKaryawan: cuti.idKaryawan ?? '' },
      include: { user: { select: { idRole: true } } },
    });
    if (applicantKaryawan?.user?.idRole === ROLES.PARTNER) {
      return Response.json({ error: 'This leave was auto-approved by the partner who submitted it.' }, { status: 400 });
    }

    // Verifikasi pilar: partner hanya approve cuti di salah satu pilar miliknya.
    const applicantDept = cuti.karyawan?.department;
    if (!applicantDept || !(auth.departments ?? []).includes(applicantDept)) {
      return Response.json({ error: 'Not your department' }, { status: 403 });
    }

    // Jika bukan kompensasi, tetap pakai jumlahHari sebagai hari cuti
    const isCompensatory = cuti.idJenisCuti === LEAVE_TYPES.COMPENSATORY;

    // Jaring pengaman: cek ulang saldo Paid Leave tepat sebelum approve, supaya
    // beberapa pengajuan pending yang masing-masing lolos cek saat submit tidak
    // bisa sama-sama di-approve sampai melebihi saldo asli.
    if (action === 'approve' && cuti.idJenisCuti === LEAVE_TYPES.PAID && cuti.idKaryawan) {
      const balance = await computeLeaveBalance(cuti.idKaryawan);
      if ((cuti.jumlahHari ?? 0) > balance.sisa) {
        return Response.json(
          {
            error: `Cannot approve: remaining Paid Leave balance is only ${balance.sisa} day(s), less than the requested ${cuti.jumlahHari} day(s). Another leave may have been approved in the meantime.`,
          },
          { status: 400 }
        );
      }
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

      // Approve kompensasi: increment cutiKompensasi di kontrak aktif
      if (isCompensatory && cuti.karyawan?.idKaryawan && cuti.jumlahHariKompensasi) {
        const activeContract = await tx.kontrakKaryawan.findFirst({
          where: { idKaryawan: cuti.karyawan.idKaryawan, idStatus: 'ST_KON_ACTIVE' },
          orderBy: { tanggalMulai: 'desc' },
        });
        if (activeContract) {
          await tx.kontrakKaryawan.update({
            where: { idKontrak: activeContract.idKontrak },
            data: { cutiKompensasi: (activeContract.cutiKompensasi ?? 0) + cuti.jumlahHariKompensasi },
          });
        }
      }

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
                ? `Your leave request (${cuti.tanggalMulai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${cuti.tanggalSelesai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}) has been approved.${isCompensatory ? ` Compensatory leave of ${cuti.jumlahHariKompensasi} day(s) will be automatically deducted when the dates arrive.` : ''}`
                : `Your leave request (${cuti.tanggalMulai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${cuti.tanggalSelesai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}) was rejected. Reason: ${catatan}`,
            idReferensi: id,
          },
        });
      }

      return u;
    });

    // Approved -> kurangi saldo otomatis (kecuali kompensasi, sudah dihandle di atas)
    if (action === 'approve' && cuti.karyawan?.idKaryawan && !isCompensatory) {
      await persistLeaveBalance(cuti.karyawan.idKaryawan);
    }
    // Approved kompensasi -> recalculate balance (karena cutiKompensasi sudah bertambah)
    if (action === 'approve' && isCompensatory && cuti.karyawan?.idKaryawan) {
      await persistLeaveBalance(cuti.karyawan.idKaryawan);
    }

    // Email notifikasi hasil persetujuan ke pemohon (isi sama dengan bell).
    const applicantEmail = cuti.karyawan?.user?.email;
    const applicantName = cuti.karyawan?.nama ?? 'Employee';
    if (applicantEmail) {
      const subject = action === 'approve' ? 'Leave approved' : 'Leave rejected';
      const range = `${cuti.tanggalMulai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${cuti.tanggalSelesai?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      const text =
        action === 'approve'
          ? `Hello ${applicantName},\n\nYour leave request (${range}) has been approved.\n\nThank you.`
          : `Hello ${applicantName},\n\nYour leave request (${range}) was rejected.\nReason: ${catatan}\n\nThank you.`;
      await sendEmail({ to: applicantEmail, subject, text });
    }

    // Tandai to-do partner selesai
    await completeTodo('LEAVE', id);

    return Response.json({ ok: true, cuti: updated });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
