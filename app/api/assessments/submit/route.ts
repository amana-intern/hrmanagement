import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ASSESSMENT_STATUS, ASSESSMENT_QUESTION_TYPES } from '@/lib/constants';

// POST /api/assessments/submit - employee mengisi assessment.
// Body: { idAssessment, answers: { [idPertanyaan]: { pilihan?, jawabanTeks? } } }
// Field yang dipakai per pertanyaan tergantung tipeSoal-nya: multiple_choice/checkbox/checkbox_grid
// = pilihan (array idOpsi, divalidasi terhadap options milik pertanyaan itu sendiri), short_answer
// = jawabanTeks. Hanya pertanyaan yang dijawab yang disimpan (bisa di-skip).
// Upsert: pengisian baru menggantikan submission lama per orang per assessment.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { idAssessment, answers } = body || {};
    if (!idAssessment) {
      return Response.json({ error: 'idAssessment is required' }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { idAssessment },
      include: {
        categories: { include: { questions: { include: { options: true } } } },
      },
    });
    if (!assessment) return Response.json({ error: 'Assessment not found' }, { status: 404 });
    if (assessment.idStatus !== ASSESSMENT_STATUS.OPEN) {
      return Response.json({ error: 'Assessment is already closed' }, { status: 409 });
    }

    const questionMap = new Map(
      assessment.categories.flatMap((c) => c.questions.map((q) => [q.idPertanyaan, q]))
    );

    // Per question type: short_answer reads `jawabanTeks`; multiple_choice/checkbox/checkbox_grid
    // read `pilihan` (array of option ids, validated against that question's own options).
    type AnswerRow = { idPertanyaan: string; pilihan: string[] | null; jawabanTeks: string | null };
    const answerRows: AnswerRow[] = [];
    if (answers && typeof answers === 'object') {
      for (const [idPertanyaan, raw] of Object.entries(answers as Record<string, unknown>)) {
        const question = questionMap.get(idPertanyaan);
        if (!question) continue;
        const value = (raw && typeof raw === 'object' ? raw : {}) as {
          pilihan?: unknown;
          jawabanTeks?: unknown;
        };

        if (question.tipeSoal === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER) {
          const text = String(value.jawabanTeks ?? '').trim();
          if (text) answerRows.push({ idPertanyaan, pilihan: null, jawabanTeks: text });
          continue;
        }

        // multiple_choice / checkbox / checkbox_grid
        const validOptionIds = new Set(question.options.map((o) => o.idOpsi));
        const ids = (Array.isArray(value.pilihan) ? value.pilihan : [])
          .map((v) => String(v))
          .filter((v) => validOptionIds.has(v));
        if (ids.length > 0) {
          answerRows.push({ idPertanyaan, pilihan: ids, jawabanTeks: null });
        }
      }
    }

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
          answers: {
            create: answerRows.map((a) => ({
              idJawaban: `${idSubmission}-${a.idPertanyaan}`,
              idPertanyaan: a.idPertanyaan,
              pilihan: a.pilihan ?? undefined,
              jawabanTeks: a.jawabanTeks,
            })),
          },
        },
      });
      return created;
    });

    return Response.json({ ok: true, submission }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
