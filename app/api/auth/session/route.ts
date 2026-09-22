import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session?.idUser) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { idUser: session.idUser },
    include: {
      role: true,
      karyawan: { include: { masterGrade: true } },
    },
  });

  if (!user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

    return Response.json({
      authenticated: true,
      user: {
        idUser: user.idUser,
        idKaryawan: user.karyawan?.idKaryawan ?? null,
        idRole: user.idRole,
        roleLabel: user.role?.namaRole ?? null,
        email: user.email,
        nama: user.karyawan?.nama ?? user.email,
        grade: user.karyawan?.masterGrade?.namaGrade ?? null,
        department: user.karyawan?.department ?? null,
      },
    });
}