import { requireAuth } from '@/lib/dal';
import { buildGradeLabel, DEPARTMENT_LABEL, ROLES, ROLE_LABEL, type Role } from '@/lib/roles';
import { prisma } from '@/lib/prisma';
import { computeLeaveBalance } from '@/lib/leave';
import { LEAVE_TYPES, LEAVE_STATUS } from '@/lib/constants';

export async function GET() {
  try {
    const auth = await requireAuth();

    const role = auth.idRole as Role;
    const roleLabel = auth.roleName ?? ROLE_LABEL[role] ?? auth.idRole;
    const departmentLabel = auth.department ? (DEPARTMENT_LABEL[auth.department] ?? auth.department) : null;

    // Row 1: grade. Admin HR / Admin OPS tidak punya grade -> tampil nama dept.
    let displayGrade = buildGradeLabel(auth.grade, auth.department);
    if (!auth.grade) {
      if (role === ROLES.ADMIN_HR) displayGrade = 'Human Resource';
      else if (role === ROLES.ADMIN_OPS) displayGrade = 'Operations';
    }

    // Row 2: "role - department". Contoh "Employee - Health". Kalau department kosong, tampil role saja.
    const rolesDivisi = departmentLabel ? `${roleLabel} - ${departmentLabel}` : roleLabel;

    // Statistik dinamis dari database (dari /api/me => selalu up-to-date).
    let sisaCuti = null;
    let accrued = null;
    let carryOver = null;
    let pendingLeaves = 0;
    let sickLeaves = 0;
    let pendingPayments = 0;
    let certificates = 0;
    let specialLeaveUsed = 0;
    let unpaidLeaveUsed = 0;
    let cvURL: string | null = null;

    if (auth.idKaryawan) {
      const id = auth.idKaryawan;
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const [balance, pendingLeaveCount, sickCount, payCount, certCount, talent, specialUsed, unpaidUsed] =
        await Promise.all([
          computeLeaveBalance(id),
          prisma.pengajuanCuti.count({ where: { idKaryawan: id, idStatus: 'ST_LEAVE_PENDING' } }),
          prisma.izinSakit.count({ where: { idKaryawan: id } }),
          prisma.paymentRequest.count({
            where: { idKaryawan: id, idStatus: { in: ['ST_PAY_PENDING_OPS', 'ST_PAY_PENDING_PARTNER'] } },
          }),
          prisma.sertifikatKaryawan.count({ where: { idKaryawan: id } }),
          prisma.talentProfile.findUnique({ where: { idKaryawan: id } }),
          prisma.pengajuanCuti.count({
            where: {
              idKaryawan: id,
              idJenisCuti: LEAVE_TYPES.SPECIAL,
              idStatus: LEAVE_STATUS.APPROVED,
              tanggalMulai: { gte: startOfYear },
            },
          }),
          prisma.pengajuanCuti.count({
            where: {
              idKaryawan: id,
              idJenisCuti: LEAVE_TYPES.UNPAID,
              idStatus: LEAVE_STATUS.APPROVED,
              tanggalMulai: { gte: startOfYear },
            },
          }),
        ]);
      sisaCuti = balance.sisa;
      accrued = balance.accrued;
      carryOver = balance.carryOver;
      pendingLeaves = pendingLeaveCount;
      sickLeaves = sickCount;
      pendingPayments = payCount;
      certificates = certCount;
      specialLeaveUsed = specialUsed;
      unpaidLeaveUsed = unpaidUsed;
      cvURL = talent?.fileCVURL ?? null;
    }

    return Response.json({
      user: {
        idRole: auth.idRole,
        nama: auth.nama,
        email: auth.email,
        roleLabel,
        departmentLabel, // untuk Partner -> tampil di Row 2 sebagai department
        rolesDivisi,
        grade: auth.grade,
        displayGrade,
        department: auth.department,
        noTelepon: auth.noTelepon,
        pictureUrl: auth.pictureUrl,
        permissions: auth.rolePermissions,
        cvURL,
        leave: { sisaCuti, accrued, carryOver, specialLeaveUsed, unpaidLeaveUsed },
        stats: { pendingLeaves, sickLeaves, pendingPayments, certificates },
      },
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Unauthorized' }, { status });
  }
}
