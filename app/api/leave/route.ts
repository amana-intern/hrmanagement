import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { canUseEmployeeFeatures, ROLES } from '@/lib/roles';
import { LEAVE_TYPES, LEAVE_STATUS } from '@/lib/constants';
import { computeLeaveBalance, parseDateOnly } from '@/lib/leave';

// POST: Employee/Admin membuat pengajuan cuti.
// Aturan (Fitur 10): Unpaid hanya boleh saat saldo Paid = 0;
// Special menstruasi maksumal 2 hari per bulan (via kolom keterangan).
// Fitur 5: tanggal dalam rentang yang diblokir HR tidak boleh dipakai.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    // Employee biasa + Admin HR/OPS boleh mengajukan (Fitur 11).
    const isAdmin = auth.idRole === ROLES.ADMIN_HR || auth.idRole === ROLES.ADMIN_OPS;
    if (!canUseEmployeeFeatures(auth.idRole) && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Account is not an employee' }, { status: 400 });
    }

    const body = await request.json();
    const { tanggalMulai, tanggalSelesai, idJenisCuti } = body || {};
    const keterangan = String(body?.keterangan ?? '').trim() || null;

    if (!tanggalMulai || !tanggalSelesai || !idJenisCuti) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    const start = parseDateOnly(tanggalMulai);
    const end = parseDateOnly(tanggalSelesai);
    if (!start || !end) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 });
    }
    if (end < start) {
      return Response.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
    }
    const jumlahHari = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Fitur 5: cek tanggal diblokir dalam rentang (berlaku semua jenis cuti)
    const startMs = start.getTime();
    const endMs = end.getTime();
    const blockedAll = await prisma.tanggalBlokir.findMany();
    const blocked = blockedAll.filter((b) => {
      const bStart = b.tanggal ? b.tanggal.getTime() : startMs;
      const bEnd = b.tanggalAkhir ? b.tanggalAkhir.getTime() : bStart;
      return bStart <= endMs && startMs <= bEnd;
    });
    if (blocked.length > 0) {
      const rangeLabel = (b: (typeof blocked)[number]) =>
        b.tanggalAkhir
          ? `${b.tanggal?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${b.tanggalAkhir.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : (b.tanggal?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) ?? '');
      return Response.json(
        {
          error: `Dates ${blocked.map(rangeLabel).filter(Boolean).join(', ')} are blocked${blocked[0]?.alasan ? ` (${blocked[0].alasan})` : ''}.`,
        },
        { status: 400 }
      );
    }

    // Fitur 10: Unpaid hanya boleh saat saldo Paid = 0; Paid tidak boleh melebihi sisa kuota.
    if (idJenisCuti === LEAVE_TYPES.PAID || idJenisCuti === LEAVE_TYPES.UNPAID) {
      const balance = await computeLeaveBalance(auth.idKaryawan);
      if (idJenisCuti === LEAVE_TYPES.PAID) {
        if (jumlahHari > balance.sisa) {
          return Response.json(
            { error: `Your remaining Paid Leave balance is ${balance.sisa} days, not enough for a ${jumlahHari}-day request.` },
            { status: 400 }
          );
        }
      } else if (balance.sisa > 0) {
        return Response.json(
          { error: `Unpaid leave can only be submitted when your Paid balance is 0. Remaining: ${balance.sisa} days.` },
          { status: 400 }
        );
      }
    }

    // Fitur 10: Special menstruasi maksimal 2 hari per bulan
    if (
      idJenisCuti === LEAVE_TYPES.SPECIAL &&
      keterangan?.toLowerCase().includes('menstruation')
    ) {
      if (jumlahHari > 2) {
        return Response.json({ error: 'Menstruation leave is limited to 2 days.' }, { status: 400 });
      }
      const monthUsage = await prisma.pengajuanCuti.findMany({
        where: {
          idKaryawan: auth.idKaryawan,
          idJenisCuti: LEAVE_TYPES.SPECIAL,
          idStatus: { in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
          tanggalMulai: {
            gte: new Date(start.getFullYear(), start.getMonth(), 1),
            lte: new Date(start.getFullYear(), start.getMonth() + 1, 0),
          },
        },
      });
      const usedThisMonth = monthUsage
        .filter((c) => c.keterangan?.toLowerCase().includes('menstruation'))
        .reduce((s, c) => s + (c.jumlahHari ?? 0), 0);
      if (usedThisMonth + jumlahHari > 2) {
        return Response.json(
          { error: `Menstruation leave used this month: ${usedThisMonth} day(s) (max 2 days/month).` },
          { status: 400 }
        );
      }
    }

    const cuti = await prisma.pengajuanCuti.create({
      data: {
        idCuti: `CT-${Date.now()}`,
        idKaryawan: auth.idKaryawan,
        tanggalMulai: start,
        tanggalSelesai: end,
        jumlahHari,
        idJenisCuti,
        idStatus: LEAVE_STATUS.PENDING,
        tanggalPengajuan: new Date(),
        keterangan,
      },
    });

    return Response.json({ ok: true, cuti }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}