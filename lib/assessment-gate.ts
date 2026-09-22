import 'server-only';
import { prisma } from '@/lib/prisma';
import { ASSESSMENT_STATUS } from '@/lib/constants';

// Gerbang assessment pertama: true bila user (yang boleh mengisi assessment)
// belum menyelesaikan assessment yang sedang terbuka.
// Dipakai oleh login/Google (redirect awal) dan layout dashboard (gate navigasi).
export async function hasPendingFirstAssessment(
  idKaryawan: string | null | undefined
): Promise<boolean> {
  if (!idKaryawan) return false;

  const now = new Date();
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
  if (!open) return false;

  const sub = await prisma.assessmentSubmission.findFirst({
    where: { idKaryawan, idAssessment: open.idAssessment },
  });

  return !sub;
}
