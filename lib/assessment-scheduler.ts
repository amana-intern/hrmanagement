import { prisma } from './prisma';
import { ASSESSMENT_STATUS } from './constants';

const dayKey = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

// Turunkan tanggalBuka/tanggalTutup/idStatus/autoOpened dari input start/end date (opsional) saat
// create/edit assessment. Start date kosong atau <= hari ini -> langsung open. End date kosong ->
// tidak ada auto-close (hanya bisa ditutup manual lewat action Close).
export function computeAssessmentSchedule(startDate?: string | null, endDate?: string | null) {
  const now = new Date();
  const tanggalBuka = startDate ? new Date(startDate) : now;
  const tanggalTutup = endDate ? new Date(endDate) : null;

  const hasStarted = !startDate || dayKey(tanggalBuka) <= dayKey(now);
  const hasEnded = !!tanggalTutup && tanggalTutup <= now;
  const isOpen = hasStarted && !hasEnded;

  return {
    tanggalBuka,
    tanggalTutup,
    idStatus: isOpen ? ASSESSMENT_STATUS.OPEN : ASSESSMENT_STATUS.CLOSED,
    autoOpened: isOpen,
  };
}

// Dipanggil oleh cron harian (app/api/cron/assessments) dan secara lazy tiap kali daftar assessment
// di-fetch, supaya transisi open/close otomatis langsung terlihat tanpa menunggu cron di lingkungan dev.
export async function applyScheduledAssessmentTransitions() {
  const now = new Date();

  await prisma.assessment.updateMany({
    where: { idStatus: ASSESSMENT_STATUS.OPEN, tanggalTutup: { lte: now } },
    data: { idStatus: ASSESSMENT_STATUS.CLOSED },
  });

  const toOpen = await prisma.assessment.findFirst({
    where: {
      idStatus: ASSESSMENT_STATUS.CLOSED,
      autoOpened: false,
      tanggalBuka: { lte: now },
      OR: [{ tanggalTutup: null }, { tanggalTutup: { gt: now } }],
    },
    orderBy: { tanggalBuka: 'asc' },
  });

  if (toOpen) {
    await prisma.assessment.updateMany({
      where: { idStatus: ASSESSMENT_STATUS.OPEN },
      data: { idStatus: ASSESSMENT_STATUS.CLOSED },
    });
    await prisma.assessment.update({
      where: { idAssessment: toOpen.idAssessment },
      data: { idStatus: ASSESSMENT_STATUS.OPEN, autoOpened: true },
    });
  }
}
