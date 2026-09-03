import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { LEAVE_TYPES } from '@/lib/constants';
import { computeLeaveBalance, parseDateOnly } from '@/lib/leave';
import { sendEmail } from '@/lib/notify';

// POST: Employee/Admin/Partner membuat pengajuan cuti.
// Aturan (Fitur 10): Unpaid hanya boleh saat saldo Paid = 0;
// Special menstruasi maksumal 2 hari per bulan (via kolom keterangan).
// Fitur 5: tanggal dalam rentang yang diblokir HR tidak boleh dipakai.
// Partner: submit langsung APPROVED (tanpa partner lain approve), notifikasi ke partner lain.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

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

    // Cuti Kompensasi: validasi field wajib + hitung dari holiday work range
    let jumlahHariKompensasi: number | null = null;
    if (idJenisCuti === LEAVE_TYPES.COMPENSATORY) {
      const tanggalKerjaHariLibur = body?.tanggalKerjaHariLibur;
      const tanggalSelesaiKerjaLibur = body?.tanggalSelesaiKerjaLibur;
      const tipeCutiKompensasi = body?.tipeCutiKompensasi;
      if (!tanggalKerjaHariLibur || !tanggalSelesaiKerjaLibur || !tipeCutiKompensasi) {
        return Response.json({ error: 'Holiday work date range and day type are required for compensatory leave.' }, { status: 400 });
      }
      if (!['FULL', 'HALF'].includes(tipeCutiKompensasi)) {
        return Response.json({ error: 'Day type must be FULL or HALF.' }, { status: 400 });
      }
      const holidayStart = parseDateOnly(tanggalKerjaHariLibur);
      const holidayEnd = parseDateOnly(tanggalSelesaiKerjaLibur);
      if (!holidayStart || !holidayEnd) {
        return Response.json({ error: 'Invalid holiday work date format.' }, { status: 400 });
      }
      if (holidayEnd < holidayStart) {
        return Response.json({ error: 'Holiday work end date cannot be earlier than start date.' }, { status: 400 });
      }
      const holidayWorkDaysCalc = Math.round((holidayEnd.getTime() - holidayStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (tipeCutiKompensasi === 'HALF' && holidayWorkDaysCalc > 1) {
        return Response.json({ error: 'Half Day compensatory leave requires exactly 1 holiday work day.' }, { status: 400 });
      }
      const multiplier = tipeCutiKompensasi === 'HALF' ? 0.5 : 1;
      jumlahHariKompensasi = holidayWorkDaysCalc * multiplier;
    }

    // Partner submit -> auto APPROVED (tanpa perlu partner lain approve)
    const isPartner = auth.idRole === ROLES.PARTNER;
    const initialStatus = isPartner ? 'ST_LEAVE_APPROVED' : 'ST_LEAVE_PENDING';
    const approvedBy = isPartner ? auth.idUser : null;
    const approvedDate = isPartner ? new Date() : null;

    const cuti = await prisma.pengajuanCuti.create({
      data: {
        idCuti: `CT-${Date.now()}`,
        idKaryawan: auth.idKaryawan,
        tanggalMulai: start,
        tanggalSelesai: end,
        jumlahHari,
        idJenisCuti,
        idStatus: initialStatus,
        tanggalPengajuan: new Date(),
        keterangan,
        disetujuiOleh: approvedBy,
        tanggalApproval: approvedDate,
        ...(idJenisCuti === LEAVE_TYPES.COMPENSATORY && {
          tanggalKerjaHariLibur: parseDateOnly(body?.tanggalKerjaHariLibur),
          tanggalSelesaiKerjaLibur: parseDateOnly(body?.tanggalSelesaiKerjaLibur),
          tipeCutiKompensasi: body?.tipeCutiKompensasi,
          jumlahHariKompensasi,
        }),
      },
    });

    // Jika partner submit, auto-approve: increment cutiKompensasi + notifikasi ke partner lain
    if (isPartner && cuti.idKaryawan) {
      // Increment cutiKompensasi di kontrak aktif
      if (idJenisCuti === LEAVE_TYPES.COMPENSATORY && cuti.jumlahHariKompensasi) {
        const activeContract = await prisma.kontrakKaryawan.findFirst({
          where: {
            idKaryawan: cuti.idKaryawan,
            idStatus: 'ST_KON_ACTIVE',
          },
          orderBy: { tanggalMulai: 'desc' },
        });
        if (activeContract) {
          await prisma.kontrakKaryawan.update({
            where: { idKontrak: activeContract.idKontrak },
            data: {
              cutiKompensasi: (activeContract.cutiKompensasi ?? 0) + cuti.jumlahHariKompensasi,
            },
          });
        }
      }

      // Buat approval history
      await prisma.approvalHistory.create({
        data: {
          idHistory: `HIST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          idReferensi: cuti.idCuti,
          modul: 'LEAVE',
          actorIdUser: auth.idUser,
          action: 'approve',
          catatan: 'Auto-approved (partner self-submit)',
        },
      });

      // Notifikasi ke partner lain di departemen berbeda
      const otherPartners = await prisma.user.findMany({
        where: {
          idRole: ROLES.PARTNER,
          idUser: { not: auth.idUser },
          karyawan: { department: { not: auth.department } },
        },
        include: { karyawan: true },
      });

      for (const partner of otherPartners) {
        if (partner.karyawan?.idKaryawan) {
          await prisma.notification.create({
            data: {
              idNotif: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              idKaryawan: partner.karyawan.idKaryawan,
              tipe: 'LEAVE_INFO',
              judul: 'Leave Notification',
              pesan: `Partner ${auth.nama} from ${auth.department} has submitted leave (${tanggalMulai} - ${tanggalSelesai}).`,
              idReferensi: cuti.idCuti,
            },
          });
        }
      }
    }

    return Response.json({ ok: true, cuti }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
