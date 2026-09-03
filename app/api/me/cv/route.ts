import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { canUseCareerHub } from '@/lib/roles';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['.pdf'];

// PATCH /api/me/cv - Employee meng-update CV (upload file -> simpan URL di TalentProfile.fileCVURL)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!canUseCareerHub(auth.idRole) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'CV file is required' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return Response.json({ error: 'Unsupported format (pdf)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'Ukuran file melebihi 5MB' }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeName = `cv-${Date.now()}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, safeName), bytes);
    const fileURL = `/uploads/${safeName}`;

    const profile = await prisma.talentProfile.upsert({
      where: { idKaryawan: auth.idKaryawan },
      update: { fileCVURL: fileURL },
      create: { idTalent: `TLT-${Date.now()}`, idKaryawan: auth.idKaryawan, fileCVURL: fileURL },
    });

    return Response.json({ ok: true, fileURL, profile });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
