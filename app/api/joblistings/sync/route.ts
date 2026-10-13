import { requireAuth } from '@/lib/dal';
import { syncLowonganToFramer, withTimeout } from '@/lib/framer-sync';
import { ROLES } from '@/lib/roles';

export const maxDuration = 60;

const SYNC_WAIT_MS = 50_000;

// POST /api/joblistings/sync — HR paksa sinkronisasi penuh ke website Framer.
// Dipakai sebagai retry kalau sync otomatis saat publish gagal.
export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sync = await withTimeout(syncLowonganToFramer(), SYNC_WAIT_MS, 'framer-sync');
    return Response.json({ ok: sync.ok, sync });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
