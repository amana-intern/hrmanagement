'use client';

import { ReactNode, useState } from 'react';
import DetailModal, { DetailRow } from './feedback/DetailModal';
import PdfPreviewModal, { PdfPreviewTarget } from './feedback/PdfPreviewModal';
import Button from './forms/Button';
import { formatDateWIB } from '@/app/utils/formatDate';
import { statusColor } from '@/app/utils/statusColor';
import { PAYMENT_KATEGORI } from '@/lib/constants';

interface Attachment {
  fileName?: string | null;
  fileURL?: string | null;
  kategori?: string | null;
}

export interface PaymentDetailRow {
  idRequest: string;
  idKategoriPayment?: string | null;
  nominal?: number | string | null;
  projectID?: string | null;
  detail?: string | null;
  createdAt?: string | null;
  tanggalJadwalPembayaran?: string | null;
  attachments?: Attachment[];
  masterKategoriPayment?: { namaKategori?: string | null } | null;
  statusLabel?: string | null;
  /** Only meaningful when statusLabel is "Rejected" — the same column holds submission notes otherwise. */
  catatan?: string | null;
}

interface PaymentDetailModalProps {
  row: PaymentDetailRow | null;
  open: boolean;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <DetailRow label={label} value={value} />;
}

function AttachmentLink({ file, label, onPreview }: { file?: Attachment | null; label: string; onPreview: (f: Attachment) => void }) {
  return (
    <DetailRow label={label}>
      {file?.fileURL ? (
        <Button variant="outline" size="sm" onClick={() => onPreview(file)}>
          View {file.fileName || label}
        </Button>
      ) : (
        <span className="italic text-amana-neutral-400">No attachment</span>
      )}
    </DetailRow>
  );
}

function formatRp(nominal?: number | string | null) {
  const num = Number(nominal);
  if (!Number.isFinite(num)) return '-';
  return `Rp ${num.toLocaleString('en-US')}`;
}

function formatTanggal(v?: string) {
  if (!v) return null;
  const parts = v.split('-');
  if (parts.length === 3) {
    return formatDateWIB(`${v}T00:00:00`);
  }
  return v;
}

export default function PaymentDetailModal({ row, open, onClose }: PaymentDetailModalProps) {
  const [preview, setPreview] = useState<PdfPreviewTarget | null>(null);

  if (!row) return null;

  let detail: Record<string, unknown> = {};
  if (typeof row.detail === 'string') {
    try { detail = JSON.parse(row.detail) as Record<string, unknown>; } catch {}
  }

  const kategori = row.idKategoriPayment ?? '';
  const att = row.attachments ?? [];
  const findAtt = (key: string) => att.find((a) => a.kategori === key) ?? null;
  const pax = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : String(v));
  const handlePreview = (f: Attachment) => {
    if (f.fileURL) setPreview({ url: f.fileURL, title: f.fileName || 'Attachment' });
  };

  let body: ReactNode;
  if (kategori === PAYMENT_KATEGORI.VENDOR) {
    body = (
      <>
        <Field label="Vendor Name" value={pax(detail.vendorName)} />
        <Field label="NPWP Vendor" value={pax(detail.vendorNpwp)} />
        <Field label="Payment Amount" value={formatRp(row.nominal)} />
        <Field label="Due Date" value={formatTanggal(pax(detail.vendorDueDate))} />
        <AttachmentLink file={findAtt('vendor-invoice')} label="Invoice" onPreview={handlePreview} />
      </>
    );
  } else if (kategori === PAYMENT_KATEGORI.INDIVIDUAL) {
    body = (
      <>
        <Field label="Name of Activity" value={pax(detail.indActivity)} />
        <Field label="Name of the Honor Receiver" value={pax(detail.indReceiver)} />
        <Field label="Their Role in This Event" value={pax(detail.individualRole)} />
        <Field label="Bank Account Name" value={pax(detail.indBankName)} />
        <Field label="Bank Account Number" value={pax(detail.indAccNumber)} />
        <Field label="Honor Components" value={pax(detail.indComponent)} />
        <Field label="Amount" value={formatRp(row.nominal)} />
        <AttachmentLink file={findAtt('ind-ktp')} label="Copy of KTP" onPreview={handlePreview} />
        <AttachmentLink file={findAtt('ind-invoice')} label="Invoice" onPreview={handlePreview} />
      </>
    );
  } else {
    body = (
      <>
        <Field label="Name of Event" value={pax(detail.perDiemEvent)} />
        <Field label="Number of Participants" value={pax(detail.perDiemParticipants)} />
        <AttachmentLink file={findAtt('perdiem-file')} label="File with Participant Details" onPreview={handlePreview} />
      </>
    );
  }

  return (
    <>
      {open && (
        <DetailModal
          title={`Submission Detail - ${row.idRequest}`}
          onClose={onClose}
          status={row.statusLabel ? { label: row.statusLabel, color: statusColor(row.statusLabel) } : null}
          topFields={
            row.statusLabel?.toLowerCase().includes('reject')
              ? [{ label: 'Rejection Reason', value: row.catatan }]
              : []
          }
        >
          <Field label="Project Manager" value={pax(detail.submittingAs)} />
          <Field label="Chargecode" value={pax(detail.chargecode)} />
          <Field label="Payment Under" value={pax(detail.paymentUnder)} />
          <Field label="To Whom" value={row.masterKategoriPayment?.namaKategori ?? row.idKategoriPayment} />
          <Field label="Event / Vendor Name" value={row.projectID} />
          <Field label="Schedule Date" value={row.tanggalJadwalPembayaran ? formatDateWIB(row.tanggalJadwalPembayaran) : undefined} />
          {body}
        </DetailModal>
      )}

      <PdfPreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}