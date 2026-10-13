import { requireAuth } from '@/lib/dal';
import { syncLowonganToFramer, withTimeout, type FramerSyncResult } from '@/lib/framer-sync';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// Sync ke Framer (WebSocket + publish) bisa lambat — beri ruang di Vercel.
export const maxDuration = 60;

// Batas tunggu sync di dalam request publish; kalau lewat, sync tetap
// jalan di background dan user diberi tahu untuk retry lewat tombol Sync.
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

// DRAFT yang tidak diupdate/publish dalam 7 hari otomatis dihapus.
const DRAFT_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

// GET /api/joblistings - lowongan aktif (untuk careerhub / umum) atau semua (HR)
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    const url = new URL(request.url);
    const all = url.searchParams.get('all') === '1';

    if (all && auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cleanup on-read: hapus draft yang lebih dari 7 hari tidak diupdate/publish.
    const cutoff = new Date(Date.now() - DRAFT_EXPIRE_MS);
    await prisma.lowonganKarir.deleteMany({
      where: { idStatus: 'DRAFT', updatedAt: { lt: cutoff } },
    });

    const list = await prisma.lowonganKarir.findMany({
      orderBy: { namaPosisi: 'asc' },
    });

    const result = (list || [])
      .filter((l) => all || l.idStatus === 'OPEN')
      .map((l) => ({
        idLowongan: l.idLowongan,
        namaPosisi: l.namaPosisi,
        deskripsi: l.deskripsi,
        idStatus: l.idStatus,
        googleFormURL: l.googleFormURL,
        tipeKerja: l.tipeKerja,
        modeKerja: l.modeKerja,
      }));

    return Response.json({ list: result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}

// POST /api/joblistings - HR menambah lowongan
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { namaPosisi, deskripsi, googleFormURL, idStatus, tipeKerja, modeKerja } = body || {};
    if (!namaPosisi || !deskripsi) {
      return Response.json({ error: 'Position name & description are required' }, { status: 400 });
    }

    const status = idStatus === 'DRAFT' ? 'DRAFT' : 'OPEN';

    const lowongan = await prisma.lowonganKarir.create({
      data: {
        idLowongan: `LWG-${Date.now()}`,
        namaPosisi,
        deskripsi,
        idStatus: status,
        googleFormURL: googleFormURL ?? null,
        tipeKerja: tipeKerja || null,
        modeKerja: modeKerja || null,
      },
    });

    // Publish langsung push ke website Framer (tunggu sampai site ter-publish).
    const sync = status === 'OPEN' ? await syncWebsite() : undefined;

    return Response.json({ ok: true, lowongan, sync }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
