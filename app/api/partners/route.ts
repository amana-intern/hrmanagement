import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// GET /api/partners — return daftar partner aktif (role PARTNER)
// Dipakai oleh frontend untuk populate dropdown "Related Partner"
// Hanya return partner yang merupakan "pilar" utama (bukan seed dummy)
export async function GET() {
  try {
    const auth = await requireAuth();

    // Semua role yang login boleh lihat daftar partner (untuk resolve "Related Partner",
    // termasuk saat Partner mengajukan payment sendiri).
    if (!auth.idRole) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const partners = await prisma.user.findMany({
      where: {
        idRole: ROLES.PARTNER,
        karyawan: {
          nama: { in: ["Nya' Zata Amani", 'Prasetya Dwicahya', 'Endiyan Rakhmanda', 'Kevin Tan'] },
        },
      },
      include: {
        karyawan: true,
      },
    });

    // Map ke format yang dibutuhkan frontend
    const list = partners
      .filter((p) => p.karyawan)
      .map((p) => ({
        idKaryawan: p.karyawan!.idKaryawan,
        nama: p.karyawan!.nama ?? '-',
        department: p.karyawan!.department ?? '',
        departments: p.karyawan!.departments ?? [],
      }));

    return Response.json({ list });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
