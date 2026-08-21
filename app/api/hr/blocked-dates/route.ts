import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';
import { parseDateOnly } from '@/lib/leave';

// GET /api/hr/blocked-dates — daftar tanggal diblokir (Admin HR, view-only utk lainnya)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const list = await prisma.tanggalBlokir.findMany({
      orderBy: { tanggal: 'asc' },
    });
    return Response.json({ list });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// POST /api/hr/blocked-dates — blokir satu tanggal atau rentang tanggal (Admin HR)
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tanggal, tanggalAkhir, alasan } = body || {};

    if (!tanggal) {
      return Response.json({ error: 'Date is required' }, { status: 400 });
    }

    const start = parseDateOnly(tanggal);
    if (!start) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 });
    }

    let end: Date | null = null;
    if (tanggalAkhir) {
      end = parseDateOnly(tanggalAkhir);
      if (!end) {
        return Response.json({ error: 'Invalid end date format' }, { status: 400 });
      }
      if (end < start) {
        return Response.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
      }
    }

    const overlap = await prisma.tanggalBlokir.findMany();
    const newStart = start.getTime();
    const newEnd = end ? end.getTime() : start.getTime();
    const hit = overlap.find((b) => {
      const bStart = b.tanggal ? b.tanggal.getTime() : newStart;
      const bEnd = b.tanggalAkhir ? b.tanggalAkhir.getTime() : bStart;
      return bStart <= newEnd && newStart <= bEnd;
    });

    if (hit) {
      const existing = hit.tanggalAkhir
        ? `${hit.tanggal?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} - ${hit.tanggalAkhir.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : (hit.tanggal?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) ?? '');
      return Response.json({ error: `Date range overlaps with blocked dates: ${existing}.` }, { status: 409 });
    }

    const created = await prisma.tanggalBlokir.create({
      data: {
        idBlokir: `BLK-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        tanggal: start,
        tanggalAkhir: end,
        alasan: alasan?.trim() || null,
      },
    });

    return Response.json({ ok: true, item: created }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}