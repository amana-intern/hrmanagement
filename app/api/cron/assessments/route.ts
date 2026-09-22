import { NextResponse } from 'next/server';
import { applyScheduledAssessmentTransitions } from '@/lib/assessment-scheduler';

// GET /api/cron/assessments — cron harian: auto-open assessment yang tanggalBuka-nya sudah tiba,
// auto-close assessment yang tanggalTutup-nya sudah tiba.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await applyScheduledAssessmentTransitions();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error running assessment scheduler:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
