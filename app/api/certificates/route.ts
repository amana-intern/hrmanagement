import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { isEmployeeRole } from '@/lib/roles';

// POST /api/certificates — tambah sertifikat milik karyawan sendiri
// GET /api/certificates — daftar sertifikat milik karyawan sendiri
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!isEmployeeRole(auth.idRole) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { judul, fileName, fileURL } = body || {};
    if (!judul) {
      return Response.json({ error: 'Judul wajib diisi' }, { status: 400 });
    }

    const cert = await prisma.sertifikatKaryawan.create({
      data: {
        idSertifikat: `SRT-${Date.now()}`,
        idKaryawan: auth.idKaryawan,
        judul,
        fileName: fileName ?? null,
        fileURL: fileURL ?? null,
      },
    });

    return Response.json({ ok: true, certificate: cert }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!isEmployeeRole(auth.idRole) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const list = await prisma.sertifikatKaryawan.findMany({
      where: { idKaryawan: auth.idKaryawan },
      orderBy: { judul: 'asc' },
    });

    return Response.json({ list });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Terjadi kesalahan' }, { status });
  }
}