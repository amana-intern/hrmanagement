import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { ASSESSMENT_STATUS } from '@/lib/constants';
import { buildCategoriesCreateInput } from '@/lib/assessment-builder';
import { applyScheduledAssessmentTransitions, computeAssessmentSchedule } from '@/lib/assessment-scheduler';

// GET /api/hr/assessments - daftar assessment + kategorinya (HR)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await applyScheduledAssessmentTransitions();

    const list = await prisma.assessment.findMany({
      include: {
        masterStatus: true,
        categories: {
          include: {
            questions: {
              include: { options: { orderBy: { urutan: 'asc' } } },
              orderBy: { urutan: 'asc' },
            },
          },
          orderBy: { namaKategori: 'asc' },
        },
        submissions: { include: { karyawan: true } },
      },
      orderBy: { tanggalBuka: 'desc' },
    });

    const result = list.map((a) => ({
      idAssessment: a.idAssessment,
      judul: a.judul,
      deskripsi: a.deskripsi,
      idStatus: a.idStatus,
      statusLabel: a.masterStatus?.namaStatus ?? a.idStatus ?? '-',
      tanggalBuka: a.tanggalBuka,
      tanggalTutup: a.tanggalTutup,
      categories: a.categories,
      totalPeserta: a.submissions.length,
    }));

    return Response.json({ list: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// POST /api/hr/assessments - HR membuat assessment + kategori + kompetensi.
// Saat dibuka (ST_ASM_OPEN), assessment lain yang masih open otomatis ditutup.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { judul, deskripsi, startDate, endDate, categories } = body || {};
    if (!judul) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const schedule = computeAssessmentSchedule(startDate, endDate);

    // Tutup assessment lain yang masih open bila yang baru langsung dibuka.
    if (schedule.idStatus === ASSESSMENT_STATUS.OPEN) {
      await prisma.assessment.updateMany({
        where: { idStatus: ASSESSMENT_STATUS.OPEN },
        data: { idStatus: ASSESSMENT_STATUS.CLOSED },
      });
    }

    const assessment = await prisma.assessment.create({
      data: {
        idAssessment: `ASM-${Date.now()}`,
        judul,
        deskripsi: deskripsi ?? null,
        ...schedule,
        categories: { create: buildCategoriesCreateInput(categories) },
      },
    });

    return Response.json({ ok: true, assessment }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
