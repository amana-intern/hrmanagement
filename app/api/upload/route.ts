import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/dal';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

// POST /api/upload - simpan file bukti ke public/uploads, balas URL publik.
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

    await mkdir(UPLOAD_DIR, { recursive: true });

    const safeName = `sr-${Date.now()}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, safeName), bytes);

    return Response.json({ ok: true, url: `/uploads/${safeName}`, name: safeName });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
