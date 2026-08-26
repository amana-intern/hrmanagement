import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// PATCH /api/hr/talent-roster/[idKaryawan] — HR mengedit department, grade, dan/atau role karyawan.
// Body: { department?, namaGrade?, namaRole?, akses? }. Logika grade/role mengikuti POST talent-roster:
// grade Head/Partner = leader -> role selalu Partner (tidak boleh diberi akses admin).
// Akses admin (Admin HR/OPS) HANYA lewat field `akses` ('admin_hr' | 'admin_ops' | kosong);
// tanpa `akses` = tanpa akses admin, dan nama Partner/Admin HR/Admin OPS di `namaRole` ditolak.
// Role custom -> salin permission Employee.
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ idKaryawan: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { idKaryawan } = await ctx.params;
    const body = await request.json();
    const { department, namaGrade, namaRole, akses, noTelepon, tanggalLahir, kontrakTanggalMulai, kontrakTanggalBerakhir } = body || {};

    const isSelf = auth.idKaryawan === idKaryawan;

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      include: {
        user: { include: { role: true } },
        masterGrade: true,
        kontrakKaryawan: { orderBy: { tanggalMulai: 'asc' } },
      },
    });
    if (!karyawan) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Koreksi tanggal kontrak aktif (mis. salah input saat Extend Contract).
    let kontrakUpdate: { tanggalMulai?: Date; tanggalBerakhir?: Date } | null = null;
    if (kontrakTanggalMulai !== undefined || kontrakTanggalBerakhir !== undefined) {
      const sorted = [...karyawan.kontrakKaryawan].sort((a, b) => {
        const ae = a.tanggalBerakhir ? a.tanggalBerakhir.getTime() : -1;
        const be = b.tanggalBerakhir ? b.tanggalBerakhir.getTime() : -1;
        if (ae !== be) return be - ae;
        return a.idKontrak < b.idKontrak ? 1 : -1;
      });
      const active = sorted[0] ?? null;
      if (!active) {
        return Response.json({ error: 'Employee has no contract to edit' }, { status: 400 });
      }

      const effStart = kontrakTanggalMulai !== undefined ? new Date(String(kontrakTanggalMulai)) : active.tanggalMulai;
      const effEnd = kontrakTanggalBerakhir !== undefined ? new Date(String(kontrakTanggalBerakhir)) : active.tanggalBerakhir;
      if (!effStart || Number.isNaN(effStart.getTime()) || !effEnd || Number.isNaN(effEnd.getTime())) {
        return Response.json({ error: 'Invalid contract date format' }, { status: 400 });
      }
      if (effEnd <= effStart) {
        return Response.json({ error: 'Contract end date must be after start date' }, { status: 400 });
      }

      const changed =
        effStart.getTime() !== (active.tanggalMulai?.getTime() ?? -1) ||
        effEnd.getTime() !== (active.tanggalBerakhir?.getTime() ?? -1);
      if (changed) {
        kontrakUpdate = {
          ...(kontrakTanggalMulai !== undefined ? { tanggalMulai: effStart } : {}),
          ...(kontrakTanggalBerakhir !== undefined ? { tanggalBerakhir: effEnd } : {}),
        };
      }
    }

    const oldDept = karyawan.department;
    const oldGrade = karyawan.masterGrade?.namaGrade ?? null;
    const oldRole = karyawan.user?.role?.namaRole ?? null;
    let newGradeName: string | null = oldGrade;

    const data: { idGrade?: string | null; department?: string | null; noTelepon?: string | null; tanggalLahir?: Date | null } = {};

    // Update nomor telepon & tanggal lahir (boleh untuk diri sendiri maupun orang lain).
    if (noTelepon !== undefined) {
      data.noTelepon = String(noTelepon ?? '').trim() || null;
    }
    if (tanggalLahir !== undefined) {
      const d = tanggalLahir ? new Date(String(tanggalLahir)) : null;
      if (d && Number.isNaN(d.getTime())) {
        return Response.json({ error: 'Invalid birth date format' }, { status: 400 });
      }
      data.tanggalLahir = d;
    }

    if (department !== undefined) {
      data.department = String(department ?? '').trim() || null;
    }

    // Resolusi grade (buat baru bila belum ada), sama seperti POST.
    let gradeName = '';
    if (namaGrade !== undefined && String(namaGrade).trim()) {
      const cleanGrade = String(namaGrade).trim();
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
      data.idGrade = grade.idGrade;
      newGradeName = grade.namaGrade ?? cleanGrade;
      gradeName = (grade.namaGrade ?? '').toLowerCase();
    } else {
      gradeName = (karyawan.masterGrade?.namaGrade ?? '').toLowerCase();
    }

    const isLeader = gradeName === 'head' || gradeName === 'partner';

    // Self-edit diizinkan untuk data profil (telepon, tanggal lahir, department,
    // grade, tanggal kontrak) — TAPI role/access diri sendiri tidak boleh diubah
    // agar HR tidak bisa terkunci dari sistem.

    // Resolusi role di luar transaksi agar error bisa di-return langsung.
    // 'employee' dari UI berarti tanpa akses admin -> diperlakukan kosong.
    const rawAkses = String(akses ?? '').trim().toLowerCase();
    const cleanAkses = rawAkses === 'employee' ? '' : rawAkses;

    let idRole: string | null = null;
    if (isLeader) {
      if (cleanAkses) {
        return Response.json(
          { error: 'Grade Head/Partner automatically becomes role Partner and cannot be given admin access.' },
          { status: 400 }
        );
      }
      // Grade leader -> role selalu Partner.
      idRole = ROLES.PARTNER;
    } else if (cleanAkses === 'admin_hr' || cleanAkses === 'admin_ops') {
      idRole = cleanAkses === 'admin_hr' ? ROLES.ADMIN_HR : ROLES.ADMIN_OPS;
      const adminRole = await prisma.role.findUnique({ where: { idRole } });
      if (!adminRole) {
        return Response.json({ error: 'Admin role not found' }, { status: 500 });
      }
    } else {
      if (cleanAkses) {
        return Response.json({ error: 'Invalid access' }, { status: 400 });
      }
      if (namaRole !== undefined) {
        const cleanRole = String(namaRole ?? '').trim();
        if (!cleanRole) {
          return Response.json({ error: 'Role is required' }, { status: 400 });
        }
        let role = await prisma.role.findFirst({
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
        // Role custom -> salin permission Employee (kecuali ROLE_EMPLOYEE).
        if (role.idRole !== ROLES.EMPLOYEE) {
          const employeePerms = await prisma.rolePermission.findMany({
            where: { idRole: ROLES.EMPLOYEE },
            select: { idPermission: true },
          });
          if (employeePerms.length > 0) {
            const existingPerms = await prisma.rolePermission.findMany({
              where: { idRole: role.idRole },
              select: { idPermission: true },
            });
            const existingSet = new Set(existingPerms.map((p) => p.idPermission));
            const toAdd = employeePerms
              .map((p) => p.idPermission)
              .filter((p) => !existingSet.has(p));
            if (toAdd.length > 0) {
              await prisma.rolePermission.createMany({
                data: toAdd.map((idPermission) => ({ idRole: role.idRole, idPermission })),
              });
            }
          }
        }
        idRole = role.idRole;
      }
    }

    // Resolusi nama role baru (akurat sesuai DB, termasuk leader -> Partner).
    let newRoleName: string | null = null;
    if (idRole) {
      const newRole = await prisma.role.findUnique({
        where: { idRole },
        select: { namaRole: true },
      });
      newRoleName = newRole?.namaRole ?? null;
    }

    // Catat histori jenjang karir: satu baris per field yang benar-benar berubah.
    const changes: { tipe: string; nilaiLama: string | null; nilaiBaru: string | null }[] = [];
    if (department !== undefined && (data.department ?? null) !== oldDept) {
      changes.push({ tipe: 'DEPARTMENT', nilaiLama: oldDept, nilaiBaru: data.department ?? null });
    }
    if (namaGrade !== undefined && String(namaGrade).trim() && newGradeName !== oldGrade) {
      changes.push({ tipe: 'GRADE', nilaiLama: oldGrade, nilaiBaru: newGradeName });
    }
    if (idRole && newRoleName !== oldRole) {
      // Self-edit: perubahan role/access diri sendiri ditolak (proteksi lockout).
      if (isSelf) {
        return Response.json(
          { error: 'You cannot change your own role/access. Ask another Admin HR.' },
          { status: 400 }
        );
      }
      changes.push({ tipe: 'ROLE', nilaiLama: oldRole, nilaiBaru: newRoleName });
    }

    await prisma.$transaction(async (tx) => {
      // Skip bila tidak ada perubahan field karyawan (mis. hanya tanggal kontrak yang diedit).
      if (Object.keys(data).length > 0) {
        await tx.karyawan.update({ where: { idKaryawan }, data });
      }
      if (karyawan.user && idRole) {
        await tx.user.update({ where: { idUser: karyawan.user.idUser }, data: { idRole } });
      }
      if (kontrakUpdate) {
        const sorted = [...karyawan.kontrakKaryawan].sort((a, b) => {
          const ae = a.tanggalBerakhir ? a.tanggalBerakhir.getTime() : -1;
          const be = b.tanggalBerakhir ? b.tanggalBerakhir.getTime() : -1;
          if (ae !== be) return be - ae;
          return a.idKontrak < b.idKontrak ? 1 : -1;
        });
        await tx.kontrakKaryawan.update({
          where: { idKontrak: sorted[0].idKontrak },
          data: kontrakUpdate,
        });
      }
      if (changes.length > 0) {
        const suffix = `${Date.now()}`;
        await tx.karyawanHistory.createMany({
          data: changes.map((c, i) => ({
            idHistory: `HST-${suffix}-${i}`,
            idKaryawan,
            tipe: c.tipe,
            nilaiLama: c.nilaiLama,
            nilaiBaru: c.nilaiBaru,
            diubahOleh: auth.nama ?? auth.idKaryawan ?? null,
          })),
        });
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// DELETE /api/hr/talent-roster/[idKaryawan] — HR menghapus karyawan secara permanen
// beserta seluruh datanya (riwayat assessment, sertifikat, cuti, kontrak, payment, dll).
// Semua child dihapus lebih dulu (FK opsional tanpa cascade), dalam satu transaksi.
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ idKaryawan: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { idKaryawan } = await ctx.params;

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      select: { idKaryawan: true, idUser: true },
    });
    if (!karyawan) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }
    if (auth.idKaryawan === idKaryawan) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const submissions = await tx.assessmentSubmission.findMany({
        where: { idKaryawan },
        select: { idSubmission: true },
      });
      if (submissions.length > 0) {
        await tx.assessmentAnswer.deleteMany({
          where: { idSubmission: { in: submissions.map((s) => s.idSubmission) } },
        });
        await tx.assessmentSubmission.deleteMany({ where: { idKaryawan } });
      }

      const payments = await tx.paymentRequest.findMany({
        where: { idKaryawan },
        select: { idRequest: true },
      });
      if (payments.length > 0) {
        await tx.paymentAttachment.deleteMany({
          where: { idRequest: { in: payments.map((p) => p.idRequest) } },
        });
        await tx.paymentRequest.deleteMany({ where: { idKaryawan } });
      }

      await tx.sertifikatKaryawan.deleteMany({ where: { idKaryawan } });
      await tx.pengajuanCuti.deleteMany({ where: { idKaryawan } });
      await tx.izinSakit.deleteMany({ where: { idKaryawan } });
      await tx.kontrakKaryawan.deleteMany({ where: { idKaryawan } });
      await tx.talentProfile.deleteMany({ where: { idKaryawan } });
      await tx.auditTrail.deleteMany({ where: { idKaryawan } });
      await tx.karyawanHistory.deleteMany({ where: { idKaryawan } });

      if (karyawan.idUser) {
        await tx.user.deleteMany({ where: { idUser: karyawan.idUser } });
      }
      await tx.karyawan.delete({ where: { idKaryawan } });
    });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
