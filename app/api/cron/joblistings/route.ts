import { NextResponse } from 'next/server';
import { syncLowonganToFramer } from '@/lib/framer-sync';

export const maxDuration = 120;

// GET /api/cron/joblistings — cron harian: sinkron ulang penuh lowongan OPEN
// ke website Framer sebagai jaring pengaman kalau sync otomatis saat publish gagal.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sync = await syncLowonganToFramer();
    if (!sync.ok) {
      return NextResponse.json({ success: false, sync }, { status: 502 });
    }
    return NextResponse.json({ success: true, sync });
  } catch (error) {
    console.error('Error running joblisting framer sync:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
