import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { CONTRACT_STATUS } from '@/lib/constants';
import { sendEmail, getDeptPartner } from '@/lib/notify';

const nota = () => `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DAY_MS = 24 * 60 * 60 * 1000;

function thresholdFor(daysRemaining: number): number | null {
  if (daysRemaining <= 30) return 30;
  if (daysRemaining <= 60) return 60;
  if (daysRemaining <= 90) return 90;
  return null;
}

function fmt(d: Date | null | undefined): string {
  if (!d) return '-';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// GET /api/cron/contracts — reminder kontrak T90/T60/T30 (harus dipanggil cron Vercel).
// 1x per ambang (dedup via Notification ber-tipe CONTRACT_REMINDER_<N> + idReferensi=idKontrak).
// Notifikasi bell + email dikirim ke: Admin HR, Partner pilar department, dan karyawan.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Transition contracts to EXPIRING (<=30 days) or EXPIRED (past end date)
    const activeContracts = await prisma.kontrakKaryawan.findMany({
      where: { idStatus: CONTRACT_STATUS.ACTIVE, tanggalBerakhir: { not: null } },
    });
    for (const c of activeContracts) {
      const daysRemaining = Math.ceil(((c.tanggalBerakhir?.getTime() ?? 0) - now.getTime()) / DAY_MS);
      if (daysRemaining <= 0) {
        await prisma.kontrakKaryawan.update({
          where: { idKontrak: c.idKontrak },
          data: { idStatus: CONTRACT_STATUS.EXPIRED },
        });
      } else if (daysRemaining <= 30) {
        await prisma.kontrakKaryawan.update({
          where: { idKontrak: c.idKontrak },
          data: { idStatus: CONTRACT_STATUS.EXPIRING },
        });
      }
    }

    const contracts = await prisma.kontrakKaryawan.findMany({
      where: {
        idStatus: CONTRACT_STATUS.ACTIVE,
        tanggalBerakhir: { gte: now },
      },
      include: { karyawan: { include: { user: true } } },
    });

    const hrUsers = await prisma.user.findMany({
      where: { idRole: ROLES.ADMIN_HR },
      include: { karyawan: true },
    });

    const sent: string[] = [];
    const skipped: string[] = [];

    for (const contract of contracts) {
      const karyawan = contract.karyawan;
      if (!karyawan || !contract.tanggalBerakhir) continue;

      const daysRemaining = Math.ceil((contract.tanggalBerakhir.getTime() - now.getTime()) / DAY_MS);
      const threshold = thresholdFor(daysRemaining);
      if (!threshold) continue;

      const tipe = `CONTRACT_REMINDER_${threshold}`;
      const exists = await prisma.notification.findFirst({
        where: { tipe, idReferensi: contract.idKontrak },
      });
      if (exists) {
        skipped.push(`${contract.idKontrak} (already notified)`);
        continue;
      }

      const nama = karyawan.nama ?? 'Employee';
      const tanggal = fmt(contract.tanggalBerakhir);
      const judul = `Contract expiring in ${threshold} days`;
      const pesanHR = `The contract of ${nama} ends on ${tanggal} (${daysRemaining} days remaining). Please review the renewal or offboarding decision.`;
      const pesanKaryawan = `Your contract ends on ${tanggal} (${daysRemaining} days remaining).`;

      const partner = await getDeptPartner(karyawan.department);
      const hrRecipients = hrUsers
        .filter((u) => u.karyawan?.idKaryawan)
        .map((u) => ({ idKaryawan: u.karyawan!.idKaryawan, email: u.email ?? null, pesan: pesanHR }));
      const recipients = [
        ...hrRecipients,
        { idKaryawan: partner?.idKaryawan ?? null, email: partner?.email ?? null, pesan: pesanHR },
        { idKaryawan: karyawan.idKaryawan, email: karyawan.user?.email ?? null, pesan: pesanKaryawan },
      ];

      for (const r of recipients) {
        if (r.idKaryawan) {
          await prisma.notification.create({
            data: {
              idNotif: nota(),
              idKaryawan: r.idKaryawan,
              tipe,
              judul,
              pesan: r.pesan,
              idReferensi: contract.idKontrak,
            },
          });
          // Buat to-do untuk partner
          if (r.idKaryawan === partner?.idKaryawan) {
            await prisma.hrTodo.create({
              data: {
                idTodo: `TODO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                idKaryawan: r.idKaryawan,
                teks: `Kontrak ${nama} expires on ${tanggal}. Review renewal/offboarding.`,
                modul: 'CONTRACT',
                idReferensi: contract.idKontrak,
              },
            });
          }
        }
        if (r.email) {
          await sendEmail({ to: r.email, subject: judul, text: r.pesan });
        }
      }

      sent.push(contract.idKontrak);
    }

    return NextResponse.json({
      success: true,
      message: `Contract reminder check completed. Sent ${sent.length}, skipped ${skipped.length}.`,
      sent,
      skipped,
    });
  } catch (error) {
    console.error('Error broadcasting contract reminders:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}