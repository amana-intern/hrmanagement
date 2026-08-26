import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/session';
import { ASSESSMENT_STATUS } from '@/lib/constants';
import { canUseEmployeeFeatures } from '@/lib/roles';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return Response.json({ error: 'Email & password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: {
        role: true,
        karyawan: {
          include: { masterGrade: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const nama = user.karyawan?.nama ?? user.email;
    const grade = user.karyawan?.masterGrade?.namaGrade ?? null;
    const department = user.karyawan?.department ?? null;
    const idKaryawan = user.karyawan?.idKaryawan ?? null;

    // Flag: user baru yang belum mengisi assessment yang sedang berjalan.
    // Hanya untuk karyawan (Employee + role custom); Partner/Admin tidak wajib.
    let needsAssessment = false;
    if (idKaryawan && canUseEmployeeFeatures(user.idRole)) {
      const now = new Date();
      const open = await prisma.assessment.findFirst({
        where: {
          idStatus: ASSESSMENT_STATUS.OPEN,
          OR: [
            { tanggalBuka: { lte: now }, tanggalTutup: null },
            { tanggalBuka: { lte: now }, tanggalTutup: { gte: now } },
          ],
        },
        orderBy: { tanggalBuka: 'desc' },
      });
      if (open) {
        const sub = await prisma.assessmentSubmission.findFirst({
          where: { idKaryawan: idKaryawan, idAssessment: open.idAssessment },
        });
        needsAssessment = !sub;
      }
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
    console.error('Login error:', error);
    return Response.json({ error: 'Something went wrong, please try again later' }, { status: 500 });
  }
}

export async function GET() {
  await deleteSession();
  return Response.json({ ok: true });
}