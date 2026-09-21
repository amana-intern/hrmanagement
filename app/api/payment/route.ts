import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { ROLES, canUseEmployeeFeatures } from '@/lib/roles';
import { sendEmail } from '@/lib/notify';

const UPLOAD_DIR = '/tmp/uploads';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

// POST /api/payment - Employee membuat pengajuan dana (status PENDING_OPS)
// Mendukung JSON (data minimal) dan multipart/form-data (detail + lampiran).
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!canUseEmployeeFeatures(auth.idRole) || !auth.idKaryawan) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();

      const projectID = form.get('projectID')?.toString() ?? '';
      const nominalStr = form.get('nominal')?.toString() ?? '';
      const idKategoriPayment = form.get('idKategoriPayment')?.toString() ?? '';
      const catatan = form.get('catatan')?.toString() ?? null;
      const detailStr = form.get('detail')?.toString() ?? null;
      const partnerDepartment = form.get('partnerDepartment')?.toString() || auth.department || null;

      if (!projectID || !nominalStr || !idKategoriPayment) {
        return Response.json({ error: 'ProjectID, amount, and category are required' }, { status: 400 });
      }

      // Simpan file lampiran (field name = kategori, mis. vendor-invoice / ind-ktp).
      await mkdir(UPLOAD_DIR, { recursive: true });
      const attachments = [];
      for (const [key, value] of form.entries()) {
        if (!(value instanceof File) || value.size <= 0) continue;
        const ext = path.extname(value.name).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) continue;
        if (value.size > MAX_BYTES)
          return Response.json({ error: 'Ukuran file melebihi 5MB' }, { status: 400 });
        const safeName = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
        const bytes = Buffer.from(await value.arrayBuffer());
        await writeFile(path.join(UPLOAD_DIR, safeName), bytes);
        attachments.push({
          idAttachment: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: value.name,
          fileURL: `/api/uploads/${safeName}`,
          kategori: key,
        });
      }

      const nominal = Number(nominalStr);
      if (!Number.isFinite(nominal)) {
        return Response.json({ error: 'Invalid amount' }, { status: 400 });
      }

      const payment = await prisma.paymentRequest.create({
        data: {
          idRequest: `REQ-${Date.now()}`,
          idKaryawan: auth.idKaryawan,
          projectID,
          nominal,
          idKategoriPayment,
          idStatus: 'ST_PAY_PENDING_OPS',
          tanggalPengajuan: new Date(),
          catatan,
          detail: detailStr,
          partnerDepartment,
          attachments: { create: attachments },
        },
      });

      const opsAdmin = await prisma.user.findFirst({
        where: { idRole: ROLES.ADMIN_OPS },
        include: { karyawan: true },
      });
      if (opsAdmin?.email && opsAdmin.karyawan?.idKaryawan) {
        await prisma.notification.create({
          data: {
            idNotif: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            idKaryawan: opsAdmin.karyawan.idKaryawan,
            tipe: 'PAY_INFO',
            judul: 'Payment Request Submitted',
            pesan: `${auth.nama} has submitted a payment request (${payment.idRequest}) for review.`,
            idReferensi: payment.idRequest,
          },
        });
        await sendEmail({
          to: opsAdmin.email,
          subject: 'Payment Request Submitted',
          text: `${auth.nama} has submitted a payment request (${payment.idRequest}) for review.`,
        });
      }

      return Response.json({ ok: true, payment }, { status: 201 });
    }

    // Fallback JSON (mantan payload minimal)
    const body = await request.json();
    const { projectID, nominal, idKategoriPayment, catatan, partnerDepartment: bodyPartnerDepartment } = body || {};
    const partnerDepartment = bodyPartnerDepartment || auth.department || null;
    if (!projectID || !nominal || !idKategoriPayment) {
      return Response.json({ error: 'ProjectID, amount, and category are required' }, { status: 400 });
    }
    const payment = await prisma.paymentRequest.create({
      data: {
        idRequest: `REQ-${Date.now()}`,
        idKaryawan: auth.idKaryawan,
        projectID,
        nominal: Number(nominal),
        idKategoriPayment,
        idStatus: 'ST_PAY_PENDING_OPS',
        tanggalPengajuan: new Date(),
        catatan: catatan ?? null,
        partnerDepartment: partnerDepartment ?? null,
      },
    });

    const opsAdmin = await prisma.user.findFirst({
      where: { idRole: ROLES.ADMIN_OPS },
      include: { karyawan: true },
    });
    if (opsAdmin?.email && opsAdmin.karyawan?.idKaryawan) {
      await prisma.notification.create({
        data: {
          idNotif: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          idKaryawan: opsAdmin.karyawan.idKaryawan,
          tipe: 'PAY_INFO',
          judul: 'Payment Request Submitted',
          pesan: `${auth.nama} has submitted a payment request (${payment.idRequest}) for review.`,
          idReferensi: payment.idRequest,
        },
      });
      await sendEmail({
        to: opsAdmin.email,
        subject: 'Payment Request Submitted',
        text: `${auth.nama} has submitted a payment request (${payment.idRequest}) for review.`,
      });
    }

    return Response.json({ ok: true, payment }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
