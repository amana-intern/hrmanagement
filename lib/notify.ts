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
// Contoh: department 'health' -> the partner's own @amana.id email.
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

const nota = () => `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

type BroadcastNotif = {
  tipe: string;
  judul: string;
  pesan: string;
  idReferensi: string;
  /** Jika diisi, tiap penerima yang punya karyawan juga mendapat to-do ini (bersamaan dengan notifikasi). */
  todo?: { teks: string; modul: string };
};

// Notifikasi ke daftar user (bell in-app + email best-effort).
// Dipakai untuk broadcast ke Admin OPS / partner pilar.
// Jika opts.todo diisi, to-do dibuat bersamaan untuk penerima yang punya karyawan.
export async function notifyUsers(
  recipients: { idKaryawan?: string | null; email?: string | null }[],
  opts: BroadcastNotif
): Promise<void> {
  // Paralel: tiap penerima independen, jadi waktu total = penerima paling lambat, bukan jumlah semuanya
  // (sebelumnya berurutan -> submit payment bisa menunggu beberapa detik untuk semua Admin OPS).
  await Promise.all(
    recipients.map(async (r) => {
      const jobs: Promise<unknown>[] = [];
      if (r.idKaryawan) {
        jobs.push(
          prisma.notification.create({
            data: {
              idNotif: nota(),
              idKaryawan: r.idKaryawan,
              tipe: opts.tipe,
              judul: opts.judul,
              pesan: opts.pesan,
              idReferensi: opts.idReferensi,
            },
          })
        );
        if (opts.todo) {
          jobs.push(
            prisma.hrTodo.create({
              data: {
                idTodo: `TODO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                idKaryawan: r.idKaryawan,
                teks: opts.todo.teks,
                modul: opts.todo.modul,
                idReferensi: opts.idReferensi,
              },
            })
          );
        }
      }
      if (r.email) jobs.push(sendEmail({ to: r.email, subject: opts.judul, text: opts.pesan }));
      await Promise.all(jobs);
    })
  );
}

// Notifikasi ke SEMUA Admin OPS (bell in-app selalu dibuat walau email kosong;
// email hanya dikirim jika user punya email). Dipakai saat submit payment dan
// saat partner final-approve (menunggu jadwal pembayaran).
export async function notifyAllOpsAdmins(opts: BroadcastNotif): Promise<void> {
  const opsAdmins = await prisma.user.findMany({
    where: { idRole: ROLES.ADMIN_OPS },
    include: { karyawan: true },
  });
  await notifyUsers(
    opsAdmins.map((ops) => ({ idKaryawan: ops.karyawan?.idKaryawan, email: ops.email })),
    opts
  );
}