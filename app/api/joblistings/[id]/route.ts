import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/dal';
import { syncLowonganToFramer, withTimeout, type FramerSyncResult } from '@/lib/framer-sync';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// Sync ke Framer (WebSocket + publish) bisa lambat — beri ruang di Vercel.
export const maxDuration = 60;

const SYNC_WAIT_MS = 50_000;

async function syncWebsite(): Promise<FramerSyncResult | undefined> {
  try {
    return await withTimeout(syncLowonganToFramer(), SYNC_WAIT_MS, 'framer-sync');
  } catch (e) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      removed: 0,
      published: false,
      durationMs: SYNC_WAIT_MS,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// PATCH /api/joblistings/[id] — HR update lowongan (biasanya takedown -> CLOSED)
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await ctx.params;
    const body = await request.json();

    const before = await prisma.lowonganKarir.findUnique({ where: { idLowongan: id } });
    if (!before) {
      return Response.json({ error: 'Job listing not found' }, { status: 404 });
    }

    const data: Record<string, string | null> = {};
    if (typeof body.namaPosisi === 'string') data.namaPosisi = body.namaPosisi;
    if (typeof body.deskripsi === 'string') data.deskripsi = body.deskripsi;
    if (typeof body.googleFormURL === 'string') data.googleFormURL = body.googleFormURL;
    if (typeof body.tipeKerja === 'string') data.tipeKerja = body.tipeKerja;
    if (typeof body.modeKerja === 'string') data.modeKerja = body.modeKerja;
    if (body.idStatus === 'DRAFT' || body.idStatus === 'OPEN' || body.idStatus === 'CLOSED') {
      data.idStatus = body.idStatus;
    }

    const lowongan = await prisma.lowonganKarir.update({
      where: { idLowongan: id },
      data,
    });

    // Sinkron ke website kalau status publik berubah (masuk/keluar OPEN)
    // atau lowongan yang sudah OPEN kontennya berubah.
    const wasPublic = before.idStatus === 'OPEN';
    const isPublic = lowongan.idStatus === 'OPEN';
    const sync = wasPublic || isPublic ? await syncWebsite() : undefined;

    return Response.json({ ok: true, lowongan, sync });
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

    const before = await prisma.lowonganKarir.findUnique({ where: { idLowongan: id } });
    if (!before) {
      return Response.json({ error: 'Job listing not found' }, { status: 404 });
    }

    await prisma.lowonganKarir.delete({ where: { idLowongan: id } });

    // Hapus dari website hanya kalau listing itu sebelumnya tampil di sana.
    const sync = before.idStatus === 'OPEN' ? await syncWebsite() : undefined;

    return Response.json({ ok: true, sync });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
