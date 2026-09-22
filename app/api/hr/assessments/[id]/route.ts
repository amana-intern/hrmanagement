import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { ASSESSMENT_STATUS } from '@/lib/constants';
import { buildCategoriesCreateInput } from '@/lib/assessment-builder';
import { computeAssessmentSchedule } from '@/lib/assessment-scheduler';

// Menghapus semua data anak assessment (submission/answer/question/option/category) — dipakai
// oleh DELETE (hapus assessment) dan PATCH full-edit (ganti soal, sehingga submission lama ikut hilang).
async function deleteAssessmentChildren(tx: Prisma.TransactionClient, id: string) {
  const submissions = await tx.assessmentSubmission.findMany({ where: { idAssessment: id }, select: { idSubmission: true } });
  const categories = await tx.assessmentCategory.findMany({ where: { idAssessment: id }, select: { idKategoriAsm: true } });
  const catIds = categories.map((c) => c.idKategoriAsm);
  const questions = await tx.assessmentQuestion.findMany({ where: { idKategoriAsm: { in: catIds } }, select: { idPertanyaan: true } });
  const qIds = questions.map((q) => q.idPertanyaan);

  await tx.assessmentAnswer.deleteMany({
    where: { OR: [{ idSubmission: { in: submissions.map((s) => s.idSubmission) } }, { idPertanyaan: { in: qIds } }] },
  });
  await tx.assessmentSubmission.deleteMany({ where: { idAssessment: id } });
  await tx.assessmentQuestionOption.deleteMany({ where: { idPertanyaan: { in: qIds } } });
  await tx.assessmentQuestion.deleteMany({ where: { idKategoriAsm: { in: catIds } } });
  await tx.assessmentCategory.deleteMany({ where: { idAssessment: id } });
}

// PATCH /api/hr/assessments/[id]
// Body { open: boolean } saja -> toggle status open/closed.
// Body dengan { judul, ... } -> full edit (title/description/status/soal), soal lama & submission
// terkait ikut diganti/dihapus.
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const assessment = await prisma.assessment.findUnique({ where: { idAssessment: id } });
    if (!assessment) return Response.json({ error: 'Assessment not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));

    if (body?.judul !== undefined) {
      if (!body.judul) return Response.json({ error: 'Title is required' }, { status: 400 });
      const schedule = computeAssessmentSchedule(body.startDate, body.endDate);

      if (schedule.idStatus === ASSESSMENT_STATUS.OPEN) {
        await prisma.assessment.updateMany({
          where: { idStatus: ASSESSMENT_STATUS.OPEN, idAssessment: { not: id } },
          data: { idStatus: ASSESSMENT_STATUS.CLOSED },
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        await deleteAssessmentChildren(tx, id);
        return tx.assessment.update({
          where: { idAssessment: id },
          data: {
            judul: body.judul,
            deskripsi: body.deskripsi ?? null,
            ...schedule,
            categories: { create: buildCategoriesCreateInput(body.categories) },
          },
        });
      });

      return Response.json({ ok: true, assessment: updated });
    }

    const open = body?.open === true;

    // Saat membuka, close assessment lain yang masih open (hanya 1 aktif).
    if (open) {
      await prisma.assessment.updateMany({
        where: { idStatus: ASSESSMENT_STATUS.OPEN },
        data: { idStatus: ASSESSMENT_STATUS.CLOSED },
      });
    }

    const updated = await prisma.assessment.update({
      where: { idAssessment: id },
      // Manual open/close menang atas jadwal — autoOpened=true saat open supaya scheduler tidak
      // membuka ulang assessment ini nanti kalau di-close manual lagi setelah tanggalBuka lewat.
      data: { idStatus: open ? ASSESSMENT_STATUS.OPEN : ASSESSMENT_STATUS.CLOSED, autoOpened: open ? true : undefined },
    });

    return Response.json({ ok: true, assessment: updated });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// DELETE /api/hr/assessments/[id] — hapus assessment beserta soal & submission terkait.
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const assessment = await prisma.assessment.findUnique({ where: { idAssessment: id } });
    if (!assessment) return Response.json({ error: 'Assessment not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await deleteAssessmentChildren(tx, id);
      await tx.assessment.delete({ where: { idAssessment: id } });
    });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
