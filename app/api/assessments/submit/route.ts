import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ASSESSMENT_STATUS } from '@/lib/constants';

// POST /api/assessments/submit — employee mengisi assessment.
// Body: { idAssessment, answers: { [idPertanyaan]: level 1-4 }, technicalSkills, selfDevelopmentAreas }
// Hanya pertanyaan yang dijawab yang disimpan (bisa di-skip). 2 isian teks wajib.
// Upsert: pengisian baru menggantikan submission lama per orang per assessment.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { idAssessment, answers, technicalSkills, selfDevelopmentAreas } = body || {};
    if (!idAssessment) {
      return Response.json({ error: 'idAssessment is required' }, { status: 400 });
    }

    const techSkills = String(technicalSkills ?? '').trim();
    const devAreas = String(selfDevelopmentAreas ?? '').trim();
    if (!techSkills || !devAreas) {
      return Response.json(
        { error: 'Technical skills & Self-development areas are required' },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { idAssessment },
      include: {
        categories: { include: { questions: true } },
      },
    });
    if (!assessment) return Response.json({ error: 'Assessment not found' }, { status: 404 });
    if (assessment.idStatus !== ASSESSMENT_STATUS.OPEN) {
      return Response.json({ error: 'Assessment is already closed' }, { status: 409 });
    }

    const validQuestionIds = new Set(
      assessment.categories.flatMap((c) => c.questions.map((q) => q.idPertanyaan))
    );

    const answerRows = Array.isArray(answers) || typeof answers === 'object'
      ? Object.entries(answers ?? {})
          .map(([idPertanyaan, lvl]) => ({
            idPertanyaan,
            level: Number(lvl),
          }))
          .filter(
            (a) =>
              validQuestionIds.has(a.idPertanyaan) &&
              Number.isInteger(a.level) &&
              a.level >= 1 &&
              a.level <= 4
          )
      : [];

    const idSubmission = `ASUB-${Date.now()}`;

    const submission = await prisma.$transaction(async (tx) => {
      const old = await tx.assessmentSubmission.findFirst({
        where: { idKaryawan: auth.idKaryawan, idAssessment },
      });
      if (old) {
        await tx.assessmentAnswer.deleteMany({ where: { idSubmission: old.idSubmission } });
        await tx.assessmentSubmission.delete({ where: { idSubmission: old.idSubmission } });
      }
      const created = await tx.assessmentSubmission.create({
        data: {
          idSubmission,
          idKaryawan: auth.idKaryawan,
          idAssessment,
          tanggalSelesai: new Date(),
          technicalSkills: techSkills,
          selfDevelopmentAreas: devAreas,
          answers: {
            create: answerRows.map((a) => ({
              idJawaban: `${idSubmission}-${a.idPertanyaan}`,
              idPertanyaan: a.idPertanyaan,
              level: a.level,
            })),
          },
        },
      });
      return created;
    });

    return Response.json({ ok: true, submission }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}