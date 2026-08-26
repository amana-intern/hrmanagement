import { PAYMENT_KATEGORI, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/constants';
import type { PaymentDetailRow } from '@/app/components/PaymentDetailModal';

export interface PayReq {
  id: string;
  idRequest: string;
  user: string;
  type: string;
  amount: string;
  projectID: string;
  status: string;
  details: null;
  action: null;
  detailRow: PaymentDetailRow;
}

export interface PaymentRaw {
  idRequest: string;
  idStatus: string;
  idKategoriPayment: string;
  nominal: string | number;
  projectID: string | null;
  detail: string | null;
  createdAt: string | null;
  attachments?: { fileName?: string | null; fileURL?: string | null; kategori?: string | null }[];
  karyawan?: { nama?: string | null };
  masterKategoriPayment?: { namaKategori?: string | null };
}

export function amountLabel(c: PaymentRaw): string {
  if (c.idKategoriPayment === PAYMENT_KATEGORI.PER_DIEM) {
    try {
      const detail = typeof c.detail === 'string' ? JSON.parse(c.detail) : c.detail;
      const p = Number(detail?.perDiemParticipants);
      if (Number.isFinite(p) && p > 0) return `${p} participant(s)`;
    } catch {}
    return 'View file';
  }
  return `Rp ${Number(c.nominal).toLocaleString('id-ID')}`;
}

export function mapPaymentRows(rows: PaymentRaw[]): PayReq[] {
  return rows.map((c) => ({
    id: c.idRequest,
    idRequest: c.idRequest,
    user: c.karyawan?.nama ?? '-',
    type: c.masterKategoriPayment?.namaKategori ?? '-',
    amount: amountLabel(c),
    projectID: c.projectID ?? '-',
    status: c.idStatus,
    details: null,
    action: null,
    detailRow: {
      idRequest: c.idRequest,
      idKategoriPayment: c.idKategoriPayment,
      nominal: c.nominal,
      projectID: c.projectID,
      detail: c.detail,
      createdAt: c.createdAt,
      attachments: c.attachments ?? [],
      masterKategoriPayment: c.masterKategoriPayment,
    },
  }));
}

// Single source of truth for payment status label/color — keeps every role's
// payment page showing the same text/color for the same status code.
export const paymentStatusLabel = (status: string) => PAYMENT_STATUS_LABELS[status] ?? status;
export const paymentStatusColor = (status: string) => PAYMENT_STATUS_COLORS[status] ?? 'bg-amana-neutral-400';
