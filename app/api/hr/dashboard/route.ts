import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { ASSESSMENT_STATUS, CONTRACT_STATUS, LEAVE_STATUS } from '@/lib/constants';

function fmt(d: Date | null | undefined): string {
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

// GET /api/hr/dashboard — ringkasan dashboard HR dari database:
// Attendance Summary, Career Hub Summary, dan To-Do List (HR-wide).
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // ---- Attendance Summary ----
    const [pendingLeaveCount, totalLeaveCount, sickCount] = await Promise.all([
      prisma.pengajuanCuti.count({ where: { idStatus: LEAVE_STATUS.PENDING } }),
      prisma.pengajuanCuti.count(),
      prisma.izinSakit.count(),
    ]);

    const [recentLeaves, recentSick] = await Promise.all([
      prisma.pengajuanCuti.findMany({
        include: { karyawan: { select: { nama: true } }, masterStatus: true },
        orderBy: { tanggalMulai: 'desc' },
        take: 5,
      }),
      prisma.izinSakit.findMany({
        include: { karyawan: { select: { nama: true } } },
        orderBy: { tanggalMulai: 'desc' },
        take: 5,
      }),
    ]);

    const attendanceUpdates = [
      ...recentLeaves.map((l) => ({
        text: `${l.masterStatus?.namaStatus ?? 'Cuti'} · ${l.karyawan?.nama ?? '-'} (${fmt(l.tanggalMulai)})`,
      })),
      ...recentSick.map((s) => ({
        text: `Izin sakit · ${s.karyawan?.nama ?? '-'} (${fmt(s.tanggalMulai)})`,
      })),
    ].slice(0, 5);

    // ---- Career Hub Summary ----
    const open = await prisma.assessment.findFirst({
      where: {
        idStatus: ASSESSMENT_STATUS.OPEN,
        OR: [
          { tanggalBuka: { lte: now }, tanggalTutup: null },
          { tanggalBuka: { lte: now }, tanggalTutup: { gte: now } },
        ],
      },
      orderBy: { tanggalBuka: 'desc' },
    });

    const [certCount, assessedCount, pendingAssessmentCount] = await Promise.all([
      prisma.sertifikatKaryawan.count(),
      open
        ? prisma.assessmentSubmission.count({ where: { idAssessment: open.idAssessment } })
        : Promise.resolve(0),
      prisma.karyawan.count({
        where: {
          user: { idRole: { notIn: [ROLES.ADMIN_HR, ROLES.ADMIN_OPS, ROLES.PARTNER] } },
          assessmentSubmissions: open
            ? { none: { idAssessment: open.idAssessment } }
            : { none: {} },
        },
      }),
    ]);

    const [recentSubmissions, recentCerts] = await Promise.all([
      prisma.assessmentSubmission.findMany({
        include: { karyawan: { select: { nama: true } } },
        orderBy: { tanggalSelesai: 'desc' },
        take: 5,
      }),
      prisma.sertifikatKaryawan.findMany({
        include: { karyawan: { select: { nama: true } } },
        orderBy: { idSertifikat: 'desc' },
        take: 5,
      }),
    ]);

    const careerUpdates = [
      ...recentSubmissions.map((s) => ({
        text: `Assessment · ${s.karyawan?.nama ?? '-'} (${fmt(s.tanggalSelesai)})`,
      })),
      ...recentCerts.map((c) => ({
        text: `Sertifikat · ${c.karyawan?.nama ?? '-'} (${c.judul ?? '-'})`,
      })),
    ].slice(0, 5);

    // ---- To-Do List ----
    const expiringDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [pendingLeaves, expiringContracts] = await Promise.all([
      prisma.pengajuanCuti.findMany({
        where: { idStatus: LEAVE_STATUS.PENDING },
        include: { karyawan: { select: { nama: true } } },
        orderBy: { tanggalMulai: 'asc' },
        take: 8,
      }),
      prisma.kontrakKaryawan.findMany({
        where: {
          idStatus: CONTRACT_STATUS.ACTIVE,
          tanggalBerakhir: { gte: now, lte: expiringDate },
        },
        include: { karyawan: { select: { nama: true } } },
        orderBy: { tanggalBerakhir: 'asc' },
        take: 8,
      }),
    ]);

    const todos = [
      ...pendingLeaves.map((l) => ({ text: `Approve cuti ${l.karyawan?.nama ?? '-'}` })),
      ...expiringContracts.map((c) => ({
        text: `Kontrak ${c.karyawan?.nama ?? '-'} berakhir ${fmt(c.tanggalBerakhir)}`,
      })),
    ];

    return Response.json({
      attendance: {
        pendingApproval: pendingLeaveCount,
        sickLeave: sickCount,
        totalLeave: totalLeaveCount,
        updates: attendanceUpdates,
      },
      career: {
        pendingApproval: pendingAssessmentCount,
        certificates: certCount,
        assessment: assessedCount,
        updates: careerUpdates,
      },
      todos,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}
