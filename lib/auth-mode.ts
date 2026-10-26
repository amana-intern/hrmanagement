import 'server-only';

/**
 * DEMO_MODE mengatur apakah login email (tanpa password) tersedia.
 *
 * - true  -> halaman /login menampilkan form email (dipakai untuk demo/lokal)
 * - false -> hanya Google SSO dengan email @<CMP_EMAIL_DOMAIN>
 *
 * Fail-closed: bila variabel tidak di-set atau nilainya tidak dikenali,
 * login email dianggap nonaktif agar production tidak pernah terbuka.
 */
export function isDemoMode(): boolean {
  const value = process.env.DEMO_MODE?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}
