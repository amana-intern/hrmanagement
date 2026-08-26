import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

// Helper notifikasi offboarding / renewal kontrak.

// TODO: ganti dengan URL form offboarding yang sebenarnya (mis. Google Form).
// Dipakai untuk notifikasi in-app & placeholder email ke karyawan.
export function OFFBOARDING_FORM_URL(idKaryawan: string): string {
  return `https://forms.gle/offboarding-${idKaryawan}`;
}

// Placeholder pengiriman email — dipakai saat RESEND_API_KEY belum di-set (dev).
export function sendEmailPlaceholder(to: string, subject: string, body: string) {
  console.warn('[EMAIL-PLACEHOLDER]', { to, subject, body });
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Kirim email via Resend. Tanpa RESEND_API_KEY -> fallback ke placeholder (log saja),
// agar dev lokal dan environment tanpa email tetap aman.
export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  if (!resend) {
    sendEmailPlaceholder(input.to, input.subject, input.text);
    return;
  }
  const from = process.env.RESEND_FROM ?? process.env.CMP_EMAIL ?? 'noreply@amana.id';
  try {
    await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  } catch (e) {
    console.error('[EMAIL-FAILED]', { to: input.to, subject: input.subject }, e);
  }
}

// Partner pilar untuk sebuah department (dipakai reminder kontrak).
// Contoh: department 'health' -> partnerhealth@company.
export async function getDeptPartner(
  department: string | null
): Promise<{ idKaryawan: string; email: string } | null> {
  if (!department) return null;
  const partner = await prisma.user.findFirst({
    where: { idRole: ROLES.PARTNER, karyawan: { department } },
    include: { karyawan: true },
  });
  if (!partner?.email || !partner.karyawan?.idKaryawan) return null;
  return { idKaryawan: partner.karyawan.idKaryawan, email: partner.email };
}