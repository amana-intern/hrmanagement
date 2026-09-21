'use client';

import { ReactNode, useState } from 'react';
import Modal from './feedback/Modal';
import PdfPreviewModal, { PdfPreviewTarget } from './feedback/PdfPreviewModal';
import Button from './forms/Button';
import StatusPill from './data-display/StatusPill';
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
  attachments?: Attachment[];
  masterKategoriPayment?: { namaKategori?: string | null } | null;
  statusLabel?: string | null;
}

interface PaymentDetailModalProps {
  row: PaymentDetailRow | null;
  open: boolean;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200 last:border-b-0">
      <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-[15px] text-amana-neutral-500 text-right break-words">{value}</span>
    </div>
  );
}

function AttachmentLink({ file, label, onPreview }: { file?: Attachment | null; label: string; onPreview: (f: Attachment) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-amana-neutral-200 last:border-b-0">
      <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">{label}</span>
      {file?.fileURL ? (
        <Button variant="outline" size="sm" onClick={() => onPreview(file)}>
          View {file.fileName || label}
        </Button>
      ) : (
        <span className="text-[15px] text-amana-neutral-400 italic">No attachment</span>
      )}
    </div>
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
        <Modal title={`Submission Detail - ${row.idRequest}`} onClose={onClose} maxWidth="max-w-2xl" className="max-h-[92vh]">
          <div className="px-5 py-2 max-h-[70vh] overflow-y-auto bg-amana-neutral-100">
            <Field label="To Whom" value={row.masterKategoriPayment?.namaKategori ?? row.idKategoriPayment} />
            <Field label="Event / Vendor Name" value={row.projectID} />
            {row.statusLabel && (
              <div className="flex items-start justify-between gap-4 py-2 border-b border-amana-neutral-200">
                <span className="text-[14px] font-semibold text-amana-neutral-400 flex-shrink-0">Status</span>
                <StatusPill color={statusColor(row.statusLabel)}>{row.statusLabel}</StatusPill>
              </div>
            )}
            {body}
          </div>
        </Modal>
      )}

      <PdfPreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}