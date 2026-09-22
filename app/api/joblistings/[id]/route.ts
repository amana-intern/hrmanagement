import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// PATCH /api/joblistings/[id] — HR update lowongan (biasanya takedown -> CLOSED)
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;
    const body = await request.json();
    const data: Record<string, string | null> = {};
    if (typeof body.namaPosisi === 'string') data.namaPosisi = body.namaPosisi;
    if (typeof body.deskripsi === 'string') data.deskripsi = body.deskripsi;
    if (typeof body.googleFormURL === 'string') data.googleFormURL = body.googleFormURL;
    if (body.idStatus === 'DRAFT' || body.idStatus === 'OPEN' || body.idStatus === 'CLOSED') {
      data.idStatus = body.idStatus;
    }

    const lowongan = await prisma.lowonganKarir.update({
      where: { idLowongan: id },
      data,
    });
    return Response.json({ ok: true, lowongan });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// DELETE /api/joblistings/[id] — HR hapus lowongan
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;
    await prisma.lowonganKarir.delete({ where: { idLowongan: id } });
    return Response.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}