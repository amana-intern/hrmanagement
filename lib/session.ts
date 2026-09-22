import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET wajib di-set di production.');
  }
  console.warn('SESSION_SECRET tidak di-set, memakai fallback insecure hanya untuk development.');
}
const encodedKey = new TextEncoder().encode(secretKey || 'insecure_dev_secret');

export type SessionPayload = {
  idUser: string;
  idRole: string;
  role: string;
  email: string;
  nama: string | null;
  grade: string | null;
  department: string | null;
  expiresAt: Date;
};

export async function encrypt(payload: Omit<SessionPayload, 'expiresAt'>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(data: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt(data);
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session')?.value;
  return decrypt(cookie);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}