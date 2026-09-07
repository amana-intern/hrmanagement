import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cron/compensatory-leave — Cron job harian untuk auto-deduct compensatory leave
// Dipanggil setiap hari (misalnya via Vercel Cron atau cron service)
// Logic: kurangi cutiKompensasi di kontrak aktif untuk setiap cuti kompensasi yang tanggalnya sudah tiba

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Tanggal hari ini (UTC midnight untuk perbandingan dengan @db.Date)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    // Ambil semua cuti kompensasi yang sudah disetujui
    const approvedCompLeaves = await prisma.pengajuanCuti.findMany({
      where: {
        idJenisCuti: 'JC04', // COMPENSATORY
        idStatus: 'ST_LEAVE_APPROVED',
        tanggalMulai: { not: null },
        tanggalSelesai: { not: null },
      },
      include: { karyawan: true },
    });

    let totalDeducted = 0;

    for (const cuti of approvedCompLeaves) {
      if (!cuti.karyawan?.idKaryawan || !cuti.tanggalMulai || !cuti.tanggalSelesai || !cuti.jumlahHariKompensasi) {
        continue;
      }

      const cutiStart = new Date(cuti.tanggalMulai);
      const cutiEnd = new Date(cuti.tanggalSelesai);

      // Cek apakah hari ini dalam rentang tanggal cuti kompensasi
      if (todayUTC >= cutiStart && todayUTC <= cutiEnd) {
        // Cari kontrak aktif karyawan
        const activeContract = await prisma.kontrakKaryawan.findFirst({
          where: {
            idKaryawan: cuti.karyawan.idKaryawan,
            idStatus: 'ST_KON_ACTIVE',
          },
          orderBy: { tanggalMulai: 'desc' },
        });

        if (activeContract && (activeContract.cutiKompensasi ?? 0) > 0) {
          // Kurangi cutiKompensasi sebanyak 1 hari
          const deduction = Math.min(1, activeContract.cutiKompensasi ?? 0);
          await prisma.kontrakKaryawan.update({
            where: { idKontrak: activeContract.idKontrak },
            data: {
              cutiKompensasi: (activeContract.cutiKompensasi ?? 0) - deduction,
            },
          });
          totalDeducted += deduction;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Compensatory leave auto-deduct completed. Deducted ${totalDeducted} day(s) from ${approvedCompLeaves.length} approved compensatory leave(s).`,
      deducted: totalDeducted,
      processed: approvedCompLeaves.length,
    });
  } catch (error) {
    console.error('Error in compensatory leave auto-deduct:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
