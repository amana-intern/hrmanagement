import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { ASSESSMENT_STATUS } from '@/lib/constants';

// PATCH /api/hr/assessments/[id] — membuka/menutup assessment.
// Body: { open: boolean }
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
      data: { idStatus: open ? ASSESSMENT_STATUS.OPEN : ASSESSMENT_STATUS.CLOSED },
    });

    return Response.json({ ok: true, assessment: updated });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}