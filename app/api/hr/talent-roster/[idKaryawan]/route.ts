import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// PATCH /api/hr/talent-roster/[idKaryawan] — HR mengedit department, grade, dan/atau role karyawan.
// Body: { department?, namaGrade?, namaRole? }. Logika grade/role mengikuti POST talent-roster:
// grade Head/Partner = leader -> role selalu Partner; role custom -> salin permission Employee;
// role Partner/Admin HR/Admin OPS ditolak utk grade non-leader.
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
    const { department, namaGrade, namaRole } = body || {};

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      include: { user: { include: { role: true } }, masterGrade: true },
    });
    if (!karyawan) {
      return Response.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const data: { idGrade?: string | null; department?: string | null } = {};
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
      gradeName = (grade.namaGrade ?? '').toLowerCase();
    } else {
      gradeName = (karyawan.masterGrade?.namaGrade ?? '').toLowerCase();
    }

    const isLeader = gradeName === 'head' || gradeName === 'partner';

    if (auth.idKaryawan === idKaryawan) {
      return Response.json({ error: 'Tidak bisa mengedit akun sendiri' }, { status: 400 });
    }

    // Resolusi role di luar transaksi agar error bisa di-return langsung.
    let idRole: string | null = null;
    if (isLeader) {
      // Grade leader -> role selalu Partner.
      idRole = ROLES.PARTNER;
    } else if (namaRole !== undefined) {
      const cleanRole = String(namaRole ?? '').trim();
      if (!cleanRole) {
        return Response.json({ error: 'Role wajib diisi' }, { status: 400 });
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
      if (
        role.idRole === ROLES.PARTNER ||
        role.idRole === ROLES.ADMIN_HR ||
        role.idRole === ROLES.ADMIN_OPS
      ) {
        return Response.json(
          { error: 'Role Partner/Admin HR/Admin OPS hanya untuk grade Head/Partner' },
          { status: 400 }
        );
      }
      // Role custom -> salin permission Employee.
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

    await prisma.$transaction(async (tx) => {
      await tx.karyawan.update({ where: { idKaryawan }, data });
      if (karyawan.user && idRole) {
        await tx.user.update({ where: { idUser: karyawan.user.idUser }, data: { idRole } });
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
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
      return Response.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }
    if (auth.idKaryawan === idKaryawan) {
      return Response.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
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

      if (karyawan.idUser) {
        await tx.user.deleteMany({ where: { idUser: karyawan.idUser } });
      }
      await tx.karyawan.delete({ where: { idKaryawan } });
    });

    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}
