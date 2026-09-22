import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/notify';

// Dev/test-only: kirim email tes langsung via sendEmail (Resend).
// Diblokir di production agar tidak bocor ke deployment publik.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const to = typeof body?.to === 'string' ? body.to.trim() : '';
  const subject = typeof body?.subject === 'string' ? body.subject : '';
  const text = typeof body?.text === 'string' ? body.text : '';

  if (!to || !subject) {
    return NextResponse.json({ error: 'to and subject are required' }, { status: 400 });
  }

  try {
    await sendEmail({ to, subject, text });
    return NextResponse.json({ ok: true, to, subject });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}