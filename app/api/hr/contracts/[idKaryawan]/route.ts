import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { OFFBOARDING_FORM_URL, sendEmail } from '@/lib/notify';

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
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      include: { user: { include: { role: true } } },
    });
    if (!karyawan) return Response.json({ error: 'Employee not found' }, { status: 404 });

    // Guard pilar: Partner hanya bisa aksi utk karyawan di department yang sama
    if (karyawan.department !== auth.department) {
      return Response.json({ error: 'Not your department' }, { status: 403 });
    }

    // Cari user HR (role ADMIN_HR) utk notifikasi
    const hrUser = await prisma.user.findFirst({
      where: { idRole: ROLES.ADMIN_HR },
      include: { karyawan: true },
    });

    const isRenewal = action === 'renewal';
    const nama = karyawan.nama ?? 'Employee';

    const judulKaryawan = isRenewal ? 'Your contract has been extended' : 'Offboarding requested for you';
    const pesanKaryawan = isRenewal
      ? `Partner ${auth.nama} requested an extension of your contract. HR will process the addendum or a new contract.`
      : `Partner ${auth.nama} requested offboarding for you. Please fill out the following offboarding form: ${OFFBOARDING_FORM_URL(idKaryawan)}`;
    const judulHR = isRenewal ? 'Contract renewal request' : 'Offboarding request';
    const pesanHR = isRenewal
      ? `Partner ${auth.nama} requested a contract renewal for ${nama}. Please process the addendum or a new contract through the system.`
      : `Partner ${auth.nama} requested offboarding for ${nama}. Please process the offboarding meeting.`;

    const emailKaryawan = isRenewal
      ? {
          subject: 'Contract renewal notice',
          text: `Hello ${nama},\n\nPartner ${auth.nama} has requested an extension of your contract. HR will process the addendum or a new contract.\n\nThank you.`,
        }
      : {
          subject: 'Offboarding Form',
          text: `Hello ${nama},\n\nPartner ${auth.nama} has requested offboarding for you. Please fill out the following offboarding form:\n${OFFBOARDING_FORM_URL(idKaryawan)}\n\nThank you.`,
        };
    const emailHR = isRenewal
      ? {
          subject: 'Contract renewal request',
          text: `Partner ${auth.nama} requested a contract renewal for ${nama}. Please process the addendum or a new contract through the system.`,
        }
      : {
          subject: 'Offboarding request',
          text: `Partner ${auth.nama} requested offboarding for ${nama}. Please process the offboarding meeting.`,
        };

    await prisma.$transaction(async (tx) => {
      // Simpan decision partner pada kontrak aktif terbaru (untuk filter Need Action HR).
      const activeContract = await tx.kontrakKaryawan.findFirst({
        where: { idKaryawan, idStatus: 'ST_KON_ACTIVE' },
        orderBy: { tanggalMulai: 'desc' },
      });
      if (activeContract) {
        await tx.kontrakKaryawan.update({
          where: { idKontrak: activeContract.idKontrak },
          data: {
            needAction: isRenewal ? 'RENEWAL' : 'OFFBOARDING',
            needActionAt: new Date(),
            needActionBy: auth.nama ?? auth.idKaryawan ?? null,
          },
        });
      }

      // Notifikasi ke Karyawan
      await tx.notification.create({
        data: {
          idNotif: nota(),
          idKaryawan,
          tipe: isRenewal ? 'CONTRACT_RENEWAL' : 'CONTRACT_OFFBOARDING',
          judul: judulKaryawan,
          pesan: pesanKaryawan,
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
            judul: judulHR,
            pesan: pesanHR,
            idReferensi: idKaryawan,
          },
        });
      }
    });

    // Email notifikasi ke karyawan & HR (renewal maupun offboarding).
    const employeeEmail = karyawan.user?.email;
    const hrEmail = hrUser?.email;
    if (employeeEmail) await sendEmail({ to: employeeEmail, ...emailKaryawan });
    if (hrEmail) await sendEmail({ to: hrEmail, ...emailHR });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}