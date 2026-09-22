import { NextRequest } from 'next/server';
import path from 'path';
import { requireAuth } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { canUseEmployeeFeatures } from '@/lib/roles';
import { notifyAllOpsAdmins } from '@/lib/notify';
import { saveFile } from '@/lib/storage';

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
      const attachments = [];
      for (const [key, value] of form.entries()) {
        if (!(value instanceof File) || value.size <= 0) continue;
        const ext = path.extname(value.name).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) continue;
        if (value.size > MAX_BYTES)
          return Response.json({ error: 'Ukuran file melebihi 5MB' }, { status: 400 });
        const safeName = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
        const bytes = Buffer.from(await value.arrayBuffer());
        const fileURL = await saveFile(bytes, safeName);
        attachments.push({
          idAttachment: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: value.name,
          fileURL,
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

      await notifyAllOpsAdmins({
        tipe: 'PAY_INFO',
        judul: 'Payment Request Submitted',
        pesan: `${auth.nama ?? 'An employee'} has submitted a payment request (${payment.idRequest}) for review.`,
        idReferensi: payment.idRequest,
        todo: { teks: `Review payment ${payment.idRequest}`, modul: 'PAYMENT_REVIEW' },
      });

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

    await notifyAllOpsAdmins({
      tipe: 'PAY_INFO',
      judul: 'Payment Request Submitted',
      pesan: `${auth.nama ?? 'An employee'} has submitted a payment request (${payment.idRequest}) for review.`,
      idReferensi: payment.idRequest,
      todo: { teks: `Review payment ${payment.idRequest}`, modul: 'PAYMENT_REVIEW' },
    });

    return Response.json({ ok: true, payment }, { status: 201 });
  } catch (e) {
    console.error('Payment error:', e);
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
