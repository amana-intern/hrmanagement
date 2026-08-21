import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { accruedMonths, consumedDays, resolvePeriod } from '@/lib/leave';

// GET /api/hr/contracts — daftar karyawan + kontrak terbaru + daysLeft.
// HR: semua departemen. Partner: hanya pilar (department) sendiri.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR && auth.idRole !== ROLES.PARTNER) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where = auth.idRole === ROLES.PARTNER ? { department: auth.department ?? '' } : {};

    const list = await prisma.karyawan.findMany({
      where,
      include: {
        masterGrade: true,
        user: { include: { role: true } },
        kontrakKaryawan: { orderBy: { tanggalMulai: 'asc' } },
      },
      orderBy: { nama: 'asc' },
    });

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const result = list.map((k) => {
      const latest = k.kontrakKaryawan.length
        ? k.kontrakKaryawan[k.kontrakKaryawan.length - 1]
        : null;
      const startDate = latest?.tanggalMulai ?? k.tanggalMasuk;
      const endDate = latest?.tanggalBerakhir;
      let daysLeft: number | null = null;
      if (endDate) {
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        daysLeft = Math.max(Math.round((end.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)), 0);
      }
      return {
        idKaryawan: k.idKaryawan,
        nama: k.nama ?? '-',
        grade: k.masterGrade?.namaGrade ?? '-',
        department: k.department ?? '-',
        roleLabel: k.user?.role?.namaRole ?? '-',
        tipeKontrak: k.tipeKontrak ?? 'KONTRAK',
        startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
        endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
        daysLeft,
        idKontrak: latest?.idKontrak ?? null,
        statusKontrak: latest?.idStatus ?? null,
      };
    });

    return Response.json({ list: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// POST /api/hr/contracts — buat/perpanjang kontrak, hitung carry-over (n/2) & kuota baru.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { idKaryawan, tanggalMulai, tanggalBerakhir } = body || {};
    if (!idKaryawan || !tanggalMulai || !tanggalBerakhir) {
      return Response.json({ error: 'idKaryawan, start date, and end date are required' }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      include: { kontrakKaryawan: { orderBy: { tanggalMulai: 'asc' } } },
    });
    if (!karyawan) return Response.json({ error: 'Employee not found' }, { status: 404 });

    // Periode terakhir (kontrak terbaru) => sumber carry-over.
    const previous = karyawan.kontrakKaryawan.length
      ? karyawan.kontrakKaryawan[karyawan.kontrakKaryawan.length - 1]
      : null;

    let carryOver = 0;
    let annualQuota = 12;

    if (previous?.tanggalMulai && previous.tanggalBerakhir) {
      const prevPeriod = resolvePeriod(previous.tanggalMulai, [
        {
          tanggalMulai: previous.tanggalMulai,
          tanggalBerakhir: previous.tanggalBerakhir,
          carryOver: previous.carryOver,
          annualQuota: previous.annualQuota,
        },
      ]);
      const consumed = await consumedDays(idKaryawan, prevPeriod.start, previous.tanggalBerakhir);
      const accrued = accruedMonths(prevPeriod.start, previous.tanggalBerakhir, prevPeriod.annualQuota);
      const remaining = Math.max(prevPeriod.carryOver + accrued - consumed, 0);
      carryOver = Math.min(remaining, Math.floor(prevPeriod.annualQuota / 2)); // n/2
      annualQuota = 12;
    }

    const contract = await prisma.kontrakKaryawan.create({
      data: {
        idKontrak: `KTR-${Date.now()}`,
        idKaryawan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalBerakhir: new Date(tanggalBerakhir),
        carryOver,
        annualQuota,
        idStatus: 'ST_KON_ACTIVE',
      },
    });

    return Response.json({ ok: true, contract });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}