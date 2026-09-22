import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// GET /api/me/career-history — Career History (KaryawanHistory) milik user yang sedang login.
// Self-service: siapapun yang punya idKaryawan boleh melihat riwayat miliknya sendiri.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const history = await prisma.karyawanHistory.findMany({
      where: { idKaryawan: auth.idKaryawan },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      list: history.map((h) => ({
        id: h.idHistory,
        aktor: h.diubahOleh,
        waktu: h.createdAt,
        changes: [
          { field: h.tipe ?? '-', from: h.nilaiLama ?? '-', to: h.nilaiBaru ?? '-' },
        ],
      })),
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
