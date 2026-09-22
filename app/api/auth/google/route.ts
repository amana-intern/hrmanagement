import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { saveFile } from '@/lib/storage';
import { hasPendingFirstAssessment } from '@/lib/assessment-gate';
import { canUseEmployeeFeatures } from '@/lib/roles';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const domain = (process.env.CMP_EMAIL_DOMAIN ?? '').toLowerCase();

const client = new OAuth2Client(googleClientId);

export async function POST(request: Request) {
  try {
    if (!googleClientId || !domain) {
      return Response.json(
        { error: 'Google configuration is incomplete. Contact the administrator.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { token } = body || {};
    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Google token not found' }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return Response.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const email = payload.email.toLowerCase();

    // Lapis keamanan domain: email harus diverifikasi Google & milik domain perusahaan.
    if (!payload.email_verified || payload.hd !== domain || !email.endsWith(`@${domain}`)) {
      return Response.json(
        { error: `Akses ditolak. Harap gunakan email @${domain}` },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        karyawan: {
          include: { masterGrade: true },
        },
      },
    });

    // Opsi A: email @domain valid tapi belum terdaftar -> tolak, arahkan ke HR.
    if (!user) {
      return Response.json(
        { error: 'Your email is not registered in the system yet. Contact HR to get activated.' },
        { status: 403 }
      );
    }

    // Link konsisten via Google `sub`: login pertama auto-link, berikutnya wajib cocok.
    // Foto profil Google diunduh & disimpan lokal (URL lh3.googleusercontent.com
    // di-rate-limit Google/429 bila di-hotlink langsung).
    const googleSub = payload.sub ?? '';
    if (googleSub) {
      if (user.googleSub && user.googleSub !== googleSub) {
        return Response.json(
          { error: 'This Google account does not match the registered account. Contact HR.' },
          { status: 403 }
        );
      }

      let pictureUrl = user.pictureUrl; // fallback: pertahankan foto lama
      if (payload.picture) {
        try {
          // Minta resolusi tinggi (default ID token hanya s96 -> blur saat ditampilkan besar).
          const hiRes = /=[sS]\d+(-c)?$/.test(payload.picture)
            ? payload.picture.replace(/=[sS]\d+(-c)?$/, '=s400-c')
            : `${payload.picture}=s400-c`;
          const res = await fetch(hiRes, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            pictureUrl = await saveFile(buffer, `avatar-${googleSub}-400.jpg`);
          }
        } catch {
          // Unduhan gagal (timeout/network) -> pakai foto lama.
        }
      }

      if (!user.googleSub || user.pictureUrl !== pictureUrl) {
        await prisma.user.update({
          where: { idUser: user.idUser },
          data: { ...(user.googleSub ? {} : { googleSub }), pictureUrl },
        });
      }
    }

    const nama = user.karyawan?.nama ?? user.email;
    const grade = user.karyawan?.masterGrade?.namaGrade ?? null;
    const department = user.karyawan?.department ?? null;
    const idKaryawan = user.karyawan?.idKaryawan ?? null;

    let needsAssessment = false;
    if (idKaryawan && canUseEmployeeFeatures(user.idRole)) {
      needsAssessment = await hasPendingFirstAssessment(idKaryawan);
    }

    await createSession({
      idUser: user.idUser,
      idRole: user.idRole ?? '',
      role: user.idRole ?? '',
      email: user.email ?? '',
      nama,
      grade,
      department,
    });

    return Response.json({
      ok: true,
      user: {
        idUser: user.idUser,
        idKaryawan,
        idRole: user.idRole,
        roleLabel: user.role?.namaRole ?? null,
        email: user.email,
        nama,
        grade,
        department,
        needsAssessment,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return Response.json(
      { error: 'Authentication failed or token expired' },
      { status: 401 }
    );
  }
}
