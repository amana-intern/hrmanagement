import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { canUseEmployeeFeatures, ROLES } from '@/lib/roles';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

// POST /api/sick — Employee/Admin mengajukan izin sakit (FormData: tanggal, gejala, file)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const isAdmin = auth.idRole === ROLES.ADMIN_HR || auth.idRole === ROLES.ADMIN_OPS;
    if ((!canUseEmployeeFeatures(auth.idRole) && !isAdmin) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const form = await request.formData();
    const tanggalMulai = form.get('tanggalMulai')?.toString() ?? '';
    const tanggalSelesai = form.get('tanggalSelesai')?.toString() ?? '';
    const gejala = form.get('gejala')?.toString() ?? '';
    const file = form.get('file');

    if (!tanggalMulai || !tanggalSelesai) {
      return Response.json({ error: 'Start & end dates are required' }, { status: 400 });
    }

    let buktiSakitURL: string | null = null;
    if (file instanceof File && file.size > 0) {
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        return Response.json({ error: 'Unsupported format (pdf/jpg/png)' }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return Response.json({ error: 'File size exceeds 5MB' }, { status: 400 });
      }
      await mkdir(UPLOAD_DIR, { recursive: true });
      const safeName = `sk-${Date.now()}${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(UPLOAD_DIR, safeName), bytes);
      buktiSakitURL = `/uploads/${safeName}`;
    }

    const sick = await prisma.izinSakit.create({
      data: {
        idIzinSakit: `SK-${Date.now()}`,
        idKaryawan: auth.idKaryawan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        gejala: gejala || null,
        buktiSakitURL,
      },
    });

    return Response.json({ ok: true, sick }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}

// GET /api/sick — HR melihat seluruh record izin sakit
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const list = await prisma.izinSakit.findMany({
      include: { karyawan: { include: { masterGrade: true } } },
      orderBy: { tanggalMulai: 'desc' },
    });

    return Response.json({ list });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Something went wrong' }, { status });
  }
}
