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
    const contracts = await prisma.kontrakKaryawan.findMany({
      where: {
        idStatus: CONTRACT_STATUS.ACTIVE,
        tanggalBerakhir: { gte: now },
      },
      include: { karyawan: { include: { user: true } } },
    });

    const hrUser = await prisma.user.findFirst({
      where: { idRole: ROLES.ADMIN_HR },
      include: { karyawan: true },
    });

    // Pre-compute which contracts actually need a reminder this run, so the
    // dedup check and partner lookup below can each run as a single batched
    // query instead of once per contract.
    const items = contracts
      .map((contract) => {
        const karyawan = contract.karyawan;
        if (!karyawan || !contract.tanggalBerakhir) return null;
        const daysRemaining = Math.ceil((contract.tanggalBerakhir.getTime() - now.getTime()) / DAY_MS);
        const threshold = thresholdFor(daysRemaining);
        if (!threshold) return null;
        return { contract, karyawan, daysRemaining, threshold, tipe: `CONTRACT_REMINDER_${threshold}` };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    const existing = items.length
      ? await prisma.notification.findMany({
          where: {
            idReferensi: { in: items.map((i) => i.contract.idKontrak) },
            tipe: { in: Array.from(new Set(items.map((i) => i.tipe))) },
          },
          select: { idReferensi: true, tipe: true },
        })
      : [];
    const alreadyNotified = new Set(existing.map((e) => `${e.tipe}:${e.idReferensi}`));

    const departments = Array.from(new Set(items.map((i) => i.karyawan.department).filter((d): d is string => !!d)));
    const partnerEntries = await Promise.all(departments.map(async (d) => [d, await getDeptPartner(d)] as const));
    const partnerByDept = new Map(partnerEntries);

    const sent: string[] = [];
    const skipped: string[] = [];

    for (const { contract, karyawan, daysRemaining, threshold, tipe } of items) {
      if (alreadyNotified.has(`${tipe}:${contract.idKontrak}`)) {
        skipped.push(`${contract.idKontrak} (already notified)`);
        continue;
      }

      const nama = karyawan.nama ?? 'Employee';
      const tanggal = fmt(contract.tanggalBerakhir);
      const judul = `Contract expiring in ${threshold} days`;
      const pesanHR = `The contract of ${nama} ends on ${tanggal} (${daysRemaining} days remaining). Please review the renewal or offboarding decision.`;
      const pesanKaryawan = `Your contract ends on ${tanggal} (${daysRemaining} days remaining).`;

      const partner = karyawan.department ? partnerByDept.get(karyawan.department) ?? null : null;
      const recipients = [
        { idKaryawan: hrUser?.karyawan?.idKaryawan ?? null, email: hrUser?.email ?? null, pesan: pesanHR },
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