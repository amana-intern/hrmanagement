import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ASSESSMENT_STATUS } from '@/lib/constants';

// GET /api/assessments/open — assessment yang sedang dibuka untuk employee,
// termasuk kategorinya + kompetensi untuk diisi.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const open = await prisma.assessment.findFirst({
      where: {
        idStatus: ASSESSMENT_STATUS.OPEN,
        OR: [
          { tanggalBuka: { lte: now }, tanggalTutup: null },
          { tanggalBuka: { lte: now }, tanggalTutup: { gte: now } },
        ],
      },
      include: {
        categories: {
          include: {
            questions: {
              include: { options: { orderBy: { urutan: 'asc' } } },
              orderBy: { urutan: 'asc' },
            },
          },
          orderBy: { namaKategori: 'asc' },
        },
      },
      orderBy: { tanggalBuka: 'desc' },
    });

    // Apakah user sudah pernah mengisi assessment ini?
    let submission = null;
    if (open) {
      submission = await prisma.assessmentSubmission.findFirst({
        where: { idKaryawan: auth.idKaryawan, idAssessment: open.idAssessment },
        include: { answers: true },
        orderBy: { tanggalSelesai: 'desc' },
      });
    }

    return Response.json({
      assessment: open
        ? {
            idAssessment: open.idAssessment,
            judul: open.judul,
            deskripsi: open.deskripsi,
            tanggalBuka: open.tanggalBuka,
            tanggalTutup: open.tanggalTutup,
            categories: open.categories,
          }
        : null,
      submission: submission
        ? {
            idSubmission: submission.idSubmission,
            technicalSkills: submission.technicalSkills,
            selfDevelopmentAreas: submission.selfDevelopmentAreas,
            answers: Object.fromEntries(
              submission.answers.map((a) => [
                a.idPertanyaan,
                { level: a.level, pilihan: a.pilihan as string[] | null, jawabanTeks: a.jawabanTeks },
              ])
            ),
          }
        : null,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}