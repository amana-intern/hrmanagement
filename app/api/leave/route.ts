import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { canUseEmployeeFeatures, ROLES } from '@/lib/roles';
import { LEAVE_TYPES } from '@/lib/constants';
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
          ? `${b.tanggal?.toLocaleDateString('id-ID')} - ${b.tanggalAkhir.toLocaleDateString('id-ID')}`
          : (b.tanggal?.toLocaleDateString('id-ID') ?? '');
      return Response.json(
        {
          error: `Tanggal ${blocked.map(rangeLabel).filter(Boolean).join(', ')} sedang diblokir${blocked[0]?.alasan ? ` (${blocked[0].alasan})` : ''}.`,
        },
        { status: 400 }
      );
    }

    // Fitur 10: Unpaid hanya boleh saat saldo Paid = 0
    if (idJenisCuti === LEAVE_TYPES.UNPAID) {
      const balance = await computeLeaveBalance(auth.idKaryawan);
      if (balance.sisa > 0) {
        return Response.json(
          { error: `Unpaid leave hanya bisa diajukan saat saldo Paid = 0. Sisa Anda: ${balance.sisa} hari.` },
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
        return Response.json({ error: 'Cuti menstruasi maksimal 2 hari.' }, { status: 400 });
      }
      const monthUsage = await prisma.pengajuanCuti.findMany({
        where: {
          idKaryawan: auth.idKaryawan,
          idJenisCuti: LEAVE_TYPES.SPECIAL,
          idStatus: { in: ['ST_LEAVE_PENDING', 'ST_LEAVE_APPROVED'] },
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
          { error: `Cuti menstruasi bulan ini sudah ${usedThisMonth} hari (maks 2 hari/bulan).` },
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
        idStatus: 'ST_LEAVE_PENDING',
        tanggalPengajuan: new Date(),
        keterangan,
      },
    });

    return Response.json({ ok: true, cuti }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
