import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { isEmployeeRole, ROLES } from '@/lib/roles';
import { PAYMENT_STATUS } from '@/lib/constants';

// GET: daftar payment request sesuai role/status
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') ?? 'all'; // all | ops | partner | mine

    const where: Record<string, unknown> = {};

    if (isEmployeeRole(auth.idRole)) {
      where.idKaryawan = auth.idKaryawan ?? undefined;
    } else if (auth.idRole === ROLES.ADMIN_OPS) {
      // Board OPS Payment Request: semua status — item yang sudah diproses tetap tampil sebagai riwayat
      if (scope === 'pending') {
        where.idStatus = {
          in: [
            PAYMENT_STATUS.PENDING_OPS,
            PAYMENT_STATUS.PENDING_PARTNER,
            PAYMENT_STATUS.REJECTED,
            PAYMENT_STATUS.APPROVED,
            PAYMENT_STATUS.SCHEDULED,
            PAYMENT_STATUS.PAID,
          ],
        };
      }
      // Board OPS Payment Scheduler: APPROVED + SCHEDULED + PAID (item tetap tampil)
      else if (scope === 'schedule') {
        where.idStatus = {
          in: [PAYMENT_STATUS.APPROVED, PAYMENT_STATUS.SCHEDULED, PAYMENT_STATUS.PAID],
        };
      }
    } else if (auth.idRole === ROLES.PARTNER) {
      // Board Partner: semua status sampai lunas — item tetap tampil sebagai riwayat
      where.idStatus = {
        in: [
          PAYMENT_STATUS.PENDING_PARTNER,
          PAYMENT_STATUS.APPROVED,
          PAYMENT_STATUS.REJECTED,
          PAYMENT_STATUS.SCHEDULED,
          PAYMENT_STATUS.PAID,
        ],
      };
    }

    const list = await prisma.paymentRequest.findMany({
      where,
      include: {
        karyawan: { include: { masterGrade: true } },
        masterKategoriPayment: true,
        masterStatus: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ list });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}