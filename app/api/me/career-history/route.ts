import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

// GET /api/me/career-history — Career History (AuditTrail) milik user yang sedang login.
// Self-service: siapapun yang punya idKaryawan boleh melihat riwayat miliknya sendiri.
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const history = await prisma.auditTrail.findMany({
      where: { idKaryawan: auth.idKaryawan },
      orderBy: { waktu: 'desc' },
    });

    return Response.json({
      list: history.map((h) => ({
        idAudit: h.idAudit,
        aktorNama: h.aktorNama,
        waktu: h.waktu,
        perubahan: h.perubahan as { field: string; from: string; to: string }[] | null,
      })),
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}
