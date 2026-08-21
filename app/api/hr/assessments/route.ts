import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { ASSESSMENT_STATUS } from '@/lib/constants';

// GET /api/hr/assessments — daftar assessment + kategorinya (HR)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}

// POST /api/hr/assessments — HR membuat assessment + kategori + kompetensi.
// Saat dibuka (ST_ASM_OPEN), assessment lain yang masih open otomatis ditutup.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { judul, deskripsi, tanggalBuka, tanggalTutup, categories, open } = body || {};
    if (!judul) {
      return Response.json({ error: 'Judul wajib diisi' }, { status: 400 });
    }

    const catList: {
      idKategoriAsm: string;
      namaKategori: string;
      questions: {
        idPertanyaan: string;
        teks: string;
        urutan: number;
        tipeSoal: string | null;
        options: { idOpsi: string; teks: string; urutan: number }[];
      }[];
    }[] = Array.isArray(categories)
      ? categories
          .filter((c: any) => c?.namaKategori)
          .map((c: any) => ({
            idKategoriAsm: `ASC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            namaKategori: String(c.namaKategori),
            questions: Array.isArray(c.questions)
              ? (c.questions as any[])
                  .filter((q: any) => q?.teks)
                  .map((q: any, i: number) => ({
                    idPertanyaan: `ASQ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
                    teks: String(q.teks),
                    urutan: i + 1,
                    tipeSoal: q.tipeSoal ? String(q.tipeSoal) : null,
                    options: Array.isArray(q.options)
                      ? (q.options as any[])
                          .filter((o: any) => o?.teks)
                          .map((o: any, oi: number) => ({
                            idOpsi: `ASO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}-${oi}`,
                            teks: String(o.teks),
                            urutan: oi + 1,
                          }))
                      : [],
                  }))
              : [],
          }))
      : [];

    const isOpen = open !== false;

    // Tutup assessment lain yang masih open bila yang baru dibuka.
    if (isOpen) {
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
        tanggalBuka: tanggalBuka ? new Date(tanggalBuka) : new Date(),
        tanggalTutup: tanggalTutup ? new Date(tanggalTutup) : null,
        idStatus: isOpen ? ASSESSMENT_STATUS.OPEN : ASSESSMENT_STATUS.CLOSED,
        categories: {
          create: catList.map((c) => ({
            idKategoriAsm: c.idKategoriAsm,
            namaKategori: c.namaKategori,
            questions: {
              create: c.questions.map((q) => ({
                idPertanyaan: q.idPertanyaan,
                teks: q.teks,
                urutan: q.urutan,
                tipeSoal: q.tipeSoal,
                options: { create: q.options },
              })),
            },
          })),
        },
      },
    });

    return Response.json({ ok: true, assessment }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}