import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { accruedMonths, consumedDays, resolvePeriod } from '@/lib/leave';

// GET /api/hr/contracts - daftar karyawan + kontrak terbaru + daysLeft.
// HR: semua departemen. Partner: hanya pilar (department) sendiri.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR && auth.idRole !== ROLES.PARTNER) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where =
      auth.idRole === ROLES.PARTNER
        ? { department: { in: auth.departments.length ? auth.departments : [auth.department ?? ''] } }
        : {};

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

    // Kontrak "terbaru" = yang tanggalBerakhir-nya paling jauh (kontrak yang sedang berlaku).
    // Tidak bergantung urutan tanggalMulai karena kontrak lama & baru bisa memiliki
    // tanggal mulai identik (ambigu saat sorting).
    const result = list.map((k) => {
      const sorted = [...k.kontrakKaryawan].sort((a, b) => {
        const ae = a.tanggalBerakhir ? a.tanggalBerakhir.getTime() : -1;
        const be = b.tanggalBerakhir ? b.tanggalBerakhir.getTime() : -1;
        if (ae !== be) return be - ae; // terakhir dulu (end paling jauh)
        return a.idKontrak < b.idKontrak ? 1 : -1; // tie-break deterministik
      });
      const latest = sorted[0] ?? null;
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
        needAction: latest?.needAction ?? null,
        needActionBy: latest?.needActionBy ?? null,
      };
    });

    return Response.json({ list: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// POST /api/hr/contracts - buat/perpanjang kontrak, hitung carry-over (n/2) & kuota baru.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { idKaryawan, tanggalMulai, tanggalBerakhir } = body || {};
    if (!idKaryawan || !tanggalMulai || !tanggalBerakhir) {
      return Response.json({ error: 'idKaryawan, startDate & endDate are required' }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { idKaryawan },
      include: { kontrakKaryawan: { orderBy: { tanggalMulai: 'asc' } } },
    });
    if (!karyawan) return Response.json({ error: 'Employee not found' }, { status: 404 });

    // Validasi rentang kontrak.
    const start = new Date(tanggalMulai);
    const end = new Date(tanggalBerakhir);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 });
    }
    if (end <= start) {
      return Response.json({ error: 'End date must be after start date' }, { status: 400 });
    }

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
          cutiKompensasi: previous.cutiKompensasi,
          cutiTerpakaiAwal: previous.cutiTerpakaiAwal,
        },
      ]);
      const consumed = await consumedDays(idKaryawan, prevPeriod.start, previous.tanggalBerakhir);
      const accrued = accruedMonths(prevPeriod.start, previous.tanggalBerakhir, prevPeriod.annualQuota);
      const remaining = Math.max(
        prevPeriod.carryOver +
          prevPeriod.cutiKompensasi +
          accrued -
          consumed -
          prevPeriod.cutiTerpakaiAwal,
        0
      );
      carryOver = Math.min(remaining, Math.floor(prevPeriod.annualQuota / 2)); // n/2
      annualQuota = 12;
    }

    const contract = await prisma.$transaction(async (tx) => {
      const created = await tx.kontrakKaryawan.create({
        data: {
          idKontrak: `KTR-${Date.now()}`,
          idKaryawan,
          tanggalMulai: start,
          tanggalBerakhir: end,
          carryOver,
          annualQuota,
          idStatus: 'ST_KON_ACTIVE',
        },
      });
      // Decision partner pada kontrak lama dianggap selesai ditindaklanjuti.
      if (previous) {
        await tx.kontrakKaryawan.update({
          where: { idKontrak: previous.idKontrak },
          data: { needAction: null, needActionAt: null, needActionBy: null },
        });
      }
      return created;
    });

    return Response.json({ ok: true, contract });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
