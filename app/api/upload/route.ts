import { NextRequest } from 'next/server';
import path from 'path';
import { requireAuth } from '@/lib/dal';
import { saveFile } from '@/lib/storage';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

// POST /api/upload - simpan file bukti ke storage, balas URL publik.
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'File not found' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return Response.json({ error: 'Unsupported format (pdf/jpg/png)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'Ukuran file melebihi 5MB' }, { status: 400 });
    }

    const safeName = `sr-${Date.now()}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileURL = await saveFile(bytes, safeName);

    return Response.json({ ok: true, url: fileURL, name: safeName });
  } catch (e) {
    console.error('Upload error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
