import 'server-only';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Lapisan penyimpanan file terpusat. Pilih provider lewat env STORAGE_PROVIDER:
//   - 'local'    (default) -> disk lokal public/uploads (dev & VPS/Docker dengan persistent volume)
//   - 'blob'               -> Vercel Blob Storage (deployment serverless seperti Vercel)
//
// Semua fitur upload sebaiknya memanggil saveFile() agar migrasi provider
// tidak menyentuh kode halaman/API satu per satu.

export type StorageProvider = 'local' | 'blob';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function getProvider(): StorageProvider {
  const p = (process.env.STORAGE_PROVIDER ?? 'local').toLowerCase();
  return p === 'blob' ? 'blob' : 'local';
}

/**
 * Simpan buffer sebagai file dan kembalikan URL/path publik yang bisa dipakai di <img src>.
 * filename harus aman (tanpa karakter aneh); caller bertanggung jawab atas nama unik.
 */
export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  const provider = getProvider();
  if (provider === 'blob') {
    return saveFileBlob(buffer, filename);
  }
  return saveFileLocal(buffer, filename);
}

async function saveFileLocal(buffer: Buffer, filename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

async function saveFileBlob(buffer: Buffer, filename: string): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blob = await put(filename, buffer, { access: 'public' });
  return blob.url;
}
