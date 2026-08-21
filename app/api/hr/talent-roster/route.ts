import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { ASSESSMENT_STATUS } from '@/lib/constants';
import bcrypt from 'bcryptjs';

// GET /api/hr/talent-roster — data roster live + assessment (terbuka/latest) + hasil per karyawan.
// Untuk tiap bidang dihitung skor rata-rata level (1-4) dari kompetensi yang dijawab.
// Saat tidak ada assessment terbuka, fallback ke assessment terbaru agar hasil tetap bisa dilihat.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const openAssessment = await prisma.assessment.findFirst({
      where: {
        idStatus: ASSESSMENT_STATUS.OPEN,
        OR: [
          { tanggalBuka: { lte: now }, tanggalTutup: null },
          { tanggalBuka: { lte: now }, tanggalTutup: { gte: now } },
        ],
      },
      include: {
        categories: {
          include: { questions: { orderBy: { urutan: 'asc' } } },
          orderBy: { namaKategori: 'asc' },
        },
      },
      orderBy: { tanggalBuka: 'desc' },
    });
    const assessment = openAssessment ?? (await prisma.assessment.findFirst({
      include: {
        categories: {
          include: { questions: { orderBy: { urutan: 'asc' } } },
          orderBy: { namaKategori: 'asc' },
        },
      },
      orderBy: { tanggalBuka: 'desc' },
    }));

    const employees = await prisma.karyawan.findMany({
      where: {
        user: {
          idRole: { notIn: [ROLES.PARTNER] },
        },
        OR: [
          { masterGrade: { is: null } },
          { masterGrade: { namaGrade: { notIn: ['Head', 'Head of Operations', 'Head OPS'] } } },
        ],
      },
      include: {
        masterGrade: true,
        user: { include: { role: true } },
        sertifikat: true,
        assessmentSubmissions: {
          where: assessment ? { idAssessment: assessment.idAssessment } : undefined,
          include: { answers: true },
          orderBy: { tanggalSelesai: 'desc' },
        },
      },
      orderBy: { nama: 'asc' },
    });

    const list = employees.map((k) => {
      const submission = k.assessmentSubmissions[0] ?? null;

      let aggregated: Record<string, { answered: number; sum: number }> = {};
      if (assessment) {
        aggregated = Object.fromEntries(
          assessment.categories.map((c) => [c.idKategoriAsm, { answered: 0, sum: 0 }])
        );
        for (const c of assessment.categories) {
          for (const q of c.questions) {
            const ans = submission?.answers.find((a) => a.idPertanyaan === q.idPertanyaan);
            if (ans?.level) {
              aggregated[c.idKategoriAsm].sum += ans.level;
              aggregated[c.idKategoriAsm].answered += 1;
            }
          }
        }
      }

      const bidangSkor: Record<string, number | null> = {};
      for (const [id, v] of Object.entries(aggregated)) {
        bidangSkor[id] = v.answered > 0 ? +(v.sum / v.answered).toFixed(2) : null;
      }

      return {
        idKaryawan: k.idKaryawan,
        nama: k.nama ?? '-',
        email: k.user?.email ?? '-',
        grade: k.masterGrade?.namaGrade ?? '-',
        department: k.department ?? '-',
        roleLabel: k.user?.role?.namaRole ?? '-',
        tipeKontrak: k.tipeKontrak ?? 'KONTRAK',
        noTelepon: k.noTelepon ?? '',
        tanggalLahir: k.tanggalLahir,
        certificates: (k.sertifikat ?? []).map((s) => ({
          idSertifikat: s.idSertifikat,
          judul: s.judul ?? 'Certificate',
          fileName: s.fileName ?? 'document.pdf',
          fileURL: s.fileURL,
        })),
        assessment: submission
          ? {
              idSubmission: submission.idSubmission,
              technicalSkills: submission.technicalSkills,
              selfDevelopmentAreas: submission.selfDevelopmentAreas,
              tanggalSelesai: submission.tanggalSelesai,
              answers: Object.fromEntries(submission.answers.map((a) => [a.idPertanyaan, a.level])),
              bidangSkor,
            }
          : null,
      };
    });

    const grades = await prisma.masterGrade.findMany({
      orderBy: { idGrade: 'asc' },
    });

    return Response.json({
      openAssessment: assessment
        ? {
            idAssessment: assessment.idAssessment,
            judul: assessment.judul,
            deskripsi: assessment.deskripsi,
            categories: assessment.categories,
          }
        : null,
      grades: grades.map((g) => ({ idGrade: g.idGrade, namaGrade: g.namaGrade ?? '' })),
      list,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// POST /api/hr/talent-roster — tambah pengguna baru (Karyawan + User).
// Body: { nama, email, namaRole, akses?, namaGrade, department?, tanggalLahir, tanggalMasuk, tanggalBerakhir?, tipeKontrak? }
// Grade wajib. Grade "Head"/"Partner" = leader -> role dipaksa ROLE_PARTNER (permission Partner).
// Selain itu = karyawan -> role bebas teks (custom) = hanya penanda; akses admin (Admin HR/OPS)
// HANYA lewat field `akses` ('admin_hr' | 'admin_ops' | kosong). Tanpa `akses` = tanpa akses admin,
// dan nama Partner/Admin HR/Admin OPS di kolom role ditolak. Role custom otomatis mendapat permission Employee.
// tipeKontrak: 'KONTRAK' (default) | 'TETAP'. Kontrak (KontrakKaryawan) hanya dibuat
// jika tipeKontrak 'KONTRAK' dan tanggalBerakhir diisi. Password default: amana123.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { nama, email, namaRole, akses, namaGrade, department, tanggalLahir, tanggalMasuk, tanggalBerakhir, tipeKontrak, noTelepon } = body || {};

    const cleanNama = String(nama ?? '').trim();
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const cleanTipe = String(tipeKontrak ?? '').trim().toUpperCase() === 'TETAP' ? 'TETAP' : 'KONTRAK';
    const cleanGrade = String(namaGrade ?? '').trim();
    if (!cleanNama) return Response.json({ error: 'Name is required' }, { status: 400 });
    if (!cleanEmail) return Response.json({ error: 'Email is required' }, { status: 400 });
    if (!cleanGrade) return Response.json({ error: 'Grade is required' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Resolusi grade: cari by nama, jika belum ada buat baru (GRD### urutan berikutnya).
    let gradeId: string | null = null;
    let gradeName = '';
    {
      let grade = await prisma.masterGrade.findFirst({
        where: { namaGrade: { equals: cleanGrade, mode: 'insensitive' } },
      });
      if (!grade) {
        const gradeRows = await prisma.masterGrade.findMany({ select: { idGrade: true } });
        let gradeSeq = 1;
        for (const row of gradeRows) {
          const m = /^GRD(\d+)$/.exec(row.idGrade);
          if (m) gradeSeq = Math.max(gradeSeq, Number(m[1]) + 1);
        }
        let newId = `GRD${String(gradeSeq).padStart(3, '0')}`;
        while (gradeRows.some((r) => r.idGrade === newId)) {
          gradeSeq += 1;
          newId = `GRD${String(gradeSeq).padStart(3, '0')}`;
        }
        grade = await prisma.masterGrade.create({ data: { idGrade: newId, namaGrade: cleanGrade } });
      }
      gradeId = grade.idGrade;
      gradeName = (grade.namaGrade ?? '').toLowerCase();
    }

    // Grade Head/Partner = leader -> role selalu Partner (permission Partner).
    const isLeader = gradeName === 'head' || gradeName === 'partner';

    // Akses admin opsional: 'admin_hr' | 'admin_ops' | kosong (tanpa akses admin).
    const cleanAkses = String(akses ?? '').trim().toLowerCase();

    let role: { idRole: string; namaRole: string | null } | null = null;
    if (isLeader) {
      if (cleanAkses) {
        return Response.json(
          { error: 'Grade Head/Partner automatically becomes role Partner and cannot be given admin access.' },
          { status: 400 }
        );
      }
      role = await prisma.role.findUnique({ where: { idRole: ROLES.PARTNER } });
      if (!role) {
        return Response.json({ error: 'Partner role not found' }, { status: 500 });
      }
    } else if (cleanAkses === 'admin_hr' || cleanAkses === 'admin_ops') {
      role = await prisma.role.findUnique({
        where: { idRole: cleanAkses === 'admin_hr' ? ROLES.ADMIN_HR : ROLES.ADMIN_OPS },
      });
      if (!role) {
        return Response.json({ error: 'Admin role not found' }, { status: 500 });
      }
    } else {
      if (cleanAkses) {
        return Response.json({ error: 'Invalid access' }, { status: 400 });
      }

      const cleanRole = String(namaRole ?? '').trim();
      if (!cleanRole) return Response.json({ error: 'Role is required' }, { status: 400 });

      // Resolusi role: cari by nama (case-insensitive), jika belum ada buat baru (ROLE_<SLUG>).
      role = await prisma.role.findFirst({
        where: { namaRole: { equals: cleanRole, mode: 'insensitive' } },
      });
      if (!role) {
        const slug = cleanRole
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        let roleSeq = 1;
        let newId = `ROLE_${slug}`;
        const roleIds = await prisma.role.findMany({ select: { idRole: true } });
        while (roleIds.some((r) => r.idRole === newId)) {
          roleSeq += 1;
          newId = `ROLE_${slug}_${roleSeq}`;
        }
        role = await prisma.role.create({ data: { idRole: newId, namaRole: cleanRole } });
      }
      if (!role) {
        return Response.json({ error: 'Role not found' }, { status: 500 });
      }

      // Grade biasa = karyawan -> role Partner/Admin HR/Admin OPS tidak boleh.
      // Akses admin HANYA melalui field `akses` (bagian Access).
      if (
        role.idRole === ROLES.PARTNER ||
        role.idRole === ROLES.ADMIN_HR ||
        role.idRole === ROLES.ADMIN_OPS
      ) {
        return Response.json(
          { error: 'Admin access is only granted via the Access field.' },
          { status: 400 }
        );
      }

      // Role custom (selain ROLE_EMPLOYEE) = karyawan -> salin permission EMPLOYEE.
      if (role.idRole !== ROLES.EMPLOYEE) {
        const employeePerms = await prisma.rolePermission.findMany({
          where: { idRole: ROLES.EMPLOYEE },
          select: { idPermission: true },
        });
        if (employeePerms.length > 0) {
          const roleId = role.idRole;
          await prisma.rolePermission.createMany({
            data: employeePerms.map((rp) => ({
              idRole: roleId,
              idPermission: rp.idPermission,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    // Validasi tanggal kontrak.
    const tanggalMulai = tanggalMasuk ? new Date(tanggalMasuk) : null;
    const tanggalAkhir = tanggalBerakhir ? new Date(tanggalBerakhir) : null;
    if (tanggalAkhir && tanggalMulai && tanggalAkhir < tanggalMulai) {
      return Response.json({ error: 'Contract end date cannot be before the start date' }, { status: 400 });
    }

    // Generate idKaryawan / idUser: KRY + urutan berikutnya.
    const karyawanRows = await prisma.karyawan.findMany({ select: { idKaryawan: true } });
    let nextSeq = 1;
    for (const row of karyawanRows) {
      const m = /^KRY(\d+)$/.exec(row.idKaryawan);
      if (m) nextSeq = Math.max(nextSeq, Number(m[1]) + 1);
    }
    let idKaryawan = `KRY${String(nextSeq).padStart(3, '0')}`;
    while (karyawanRows.some((r) => r.idKaryawan === idKaryawan)) {
      nextSeq += 1;
      idKaryawan = `KRY${String(nextSeq).padStart(3, '0')}`;
    }

    const passwordHash = await bcrypt.hash('amana123', 10);

    await prisma.$transaction(async (tx) => {
      await tx.karyawan.create({
        data: {
          idKaryawan,
          idUser: idKaryawan,
          nama: cleanNama,
          idGrade: gradeId,
          department: department || null,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
          tanggalMasuk: tanggalMulai,
          sisaCutiTahunan: 12,
          accrualRate: 1,
          tipeKontrak: cleanTipe,
          noTelepon: String(noTelepon ?? '').trim() || null,
        },
      });
      await tx.user.create({
        data: {
          idUser: idKaryawan,
          email: cleanEmail,
          passwordHash,
          idRole: role.idRole,
        },
      });
      if (cleanTipe === 'KONTRAK' && tanggalAkhir) {
        await tx.kontrakKaryawan.create({
          data: {
            idKontrak: `KTR-${Date.now()}`,
            idKaryawan,
            tanggalMulai: tanggalMulai ?? new Date(),
            tanggalBerakhir: tanggalAkhir,
            carryOver: 0,
            annualQuota: 12,
            idStatus: 'ST_KON_ACTIVE',
          },
        });
      }
    });

    return Response.json(
      { ok: true, user: { idUser: idKaryawan, nama: cleanNama, email: cleanEmail, idRole: role.idRole, namaRole: role.namaRole }, password: 'amana123' },
      { status: 201 }
    );
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}