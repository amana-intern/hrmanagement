import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/hr/assessments/[id]/results
// Query: ?category=<idKategoriAsm>&minLevel=<number>
// Menampilkan hasil keseluruhan + sortir/filter per bidang (rata-rata level 1-4).
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category') ?? null;
    const minLevel = Number(url.searchParams.get('minLevel') ?? '') || null;

    const assessment = await prisma.assessment.findUnique({
      where: { idAssessment: id },
      include: {
        categories: { include: { questions: { orderBy: { urutan: 'asc' } } } },
      },
    });
    if (!assessment) return Response.json({ error: 'Assessment not found' }, { status: 404 });

    const submissions = await prisma.assessmentSubmission.findMany({
      where: { idAssessment: id },
      include: {
        karyawan: { include: { masterGrade: true } },
        answers: true,
      },
    });

    const rows = submissions.map((s) => {
      const answerLevels = new Map(s.answers.map((a) => [a.idPertanyaan, a.level]));

      // Rata-rata level per kategori (hitung dari kompetensi yang dijawab).
      const bidang: Record<string, { nama: string; avg: number | null }> = {};
      for (const c of assessment.categories) {
        let sum = 0;
        let count = 0;
        for (const q of c.questions) {
          const lvl = answerLevels.get(q.idPertanyaan);
          if (lvl && lvl >= 1 && lvl <= 4) {
            sum += lvl;
            count += 1;
          }
        }
        bidang[c.idKategoriAsm] = { nama: c.namaKategori ?? '-', avg: count > 0 ? +(sum / count).toFixed(2) : null };
      }

      return {
        idSubmission: s.idSubmission,
        nama: s.karyawan?.nama ?? '-',
        grade: s.karyawan?.masterGrade?.namaGrade ?? '-',
        department: s.karyawan?.department ?? '-',
        tanggalSelesai: s.tanggalSelesai,
        technicalSkills: s.technicalSkills,
        selfDevelopmentAreas: s.selfDevelopmentAreas,
        bidang,
      };
    });

    let filtered = rows;
    if (categoryId) {
      filtered = filtered.filter((r) => r.bidang[categoryId]?.avg != null);
      if (minLevel) {
        filtered = filtered.filter((r) => (r.bidang[categoryId]?.avg ?? 0) >= minLevel);
      }
      filtered = [...filtered].sort(
        (a, b) => (b.bidang[categoryId]?.avg ?? 0) - (a.bidang[categoryId]?.avg ?? 0)
      );
    }

    return Response.json({
      assessment: {
        idAssessment: assessment.idAssessment,
        judul: assessment.judul,
        idStatus: assessment.idStatus,
        categories: assessment.categories,
      },
      list: filtered,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}