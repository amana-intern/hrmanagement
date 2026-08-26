import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { canUseEmployeeFeatures } from '@/lib/roles';

// PATCH/DELETE /api/certificates/[id] — update/hapus sertifikat milik sendiri
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!canUseEmployeeFeatures(auth.idRole) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const existing = await prisma.sertifikatKaryawan.findUnique({ where: { idSertifikat: id } });
    if (!existing) return Response.json({ error: 'Certificate not found' }, { status: 404 });
    if (existing.idKaryawan !== auth.idKaryawan) {
      return Response.json({ error: 'Not your certificate' }, { status: 403 });
    }

    const body = await request.json();
    const { judul, fileName, fileURL } = body || {};

    const cert = await prisma.sertifikatKaryawan.update({
      where: { idSertifikat: id },
      data: {
        judul: judul ?? existing.judul,
        fileName: fileName ?? existing.fileName,
        fileURL: fileURL ?? existing.fileURL,
      },
    });

    return Response.json({ ok: true, certificate: cert });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!canUseEmployeeFeatures(auth.idRole) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;

    const existing = await prisma.sertifikatKaryawan.findUnique({ where: { idSertifikat: id } });
    if (!existing) return Response.json({ error: 'Certificate not found' }, { status: 404 });
    if (existing.idKaryawan !== auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.sertifikatKaryawan.delete({ where: { idSertifikat: id } });
    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}