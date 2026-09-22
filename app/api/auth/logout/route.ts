import { NextRequest } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  await deleteSession();
  return Response.json({ ok: true });
}