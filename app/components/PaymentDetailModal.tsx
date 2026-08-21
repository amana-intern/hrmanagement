'use client';

import { ReactNode, useState } from 'react';
import Modal from './feedback/Modal';
import { PAYMENT_KATEGORI } from '@/lib/constants';
import { DEPARTMENT_LABEL } from '@/lib/roles';
import { formatDateWIB } from '@/app/utils/formatDate';

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
  karyawan?: { nama?: string | null; department?: string | null } | null;
}

interface PaymentDetailModalProps {
  row: PaymentDetailRow | null;
  open: boolean;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-2.5 border-b border-amana-neutral-200 last:border-0">
      <p className="text-xs font-medium text-amana-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-amana-neutral-700 break-words">{value}</p>
    </div>
  );
}

function AttachmentLink({ file, label, onPreview }: { file?: Attachment | null; label: string; onPreview: (f: Attachment) => void }) {
  if (!file?.fileURL) {
    return (
      <div className="py-2.5 border-b border-amana-neutral-200 last:border-0">
        <p className="text-xs font-medium text-amana-neutral-500 mb-0.5">{label}</p>
        <p className="text-sm text-amana-neutral-400 italic">No attachments</p>
      </div>
    );
  }
  return (
    <div className="py-2.5 border-b border-amana-neutral-200 last:border-0">
      <p className="text-xs font-medium text-amana-neutral-500 mb-1">{label}</p>
      <button
        onClick={() => onPreview(file)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amana-primary-500/5 border border-amana-primary-500/25 text-amana-primary-500 text-xs font-semibold hover:bg-amana-primary-500/10 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        View {file.fileName || label}
      </button>
    </div>
  );
}

function formatRp(nominal?: number | string | null) {
  const num = Number(nominal);
  if (!Number.isFinite(num)) return '-';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

function formatTanggal(v?: string) {
  if (!v) return null;
  const parts = v.split('-');
  if (parts.length === 3) {
    const d = new Date(`${v}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return formatDateWIB(d);
  }
  return v;
}

export default function PaymentDetailModal({ row, open, onClose }: PaymentDetailModalProps) {
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  if (!row) return null;

  let detail: Record<string, unknown> = {};
  if (typeof row.detail === 'string') {
    try { detail = JSON.parse(row.detail) as Record<string, unknown>; } catch {}
  }

  const kategori = row.idKategoriPayment ?? '';
  const att = row.attachments ?? [];
  const findAtt = (key: string) => att.find((a) => a.kategori === key) ?? null;
  const pax = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : String(v));
  const practiceGroup = pax(detail.practiceGroup);
  const deptLabel = row.karyawan?.department
    ? DEPARTMENT_LABEL[row.karyawan.department] ?? row.karyawan.department
    : '';
  const deptPracticeGroup = `${deptLabel}${practiceGroup ? ` / ${practiceGroup}` : ''}` || undefined;
  const handlePreview = (f: Attachment) => {
    if (f.fileURL) setPreview({ url: f.fileURL, name: f.fileName || 'Attachment' });
  };

  let body: ReactNode;
  if (kategori === PAYMENT_KATEGORI.VENDOR) {
    body = (
      <>
        <Field label="NPWP Vendor" value={pax(detail.vendorNpwp)} />
        <Field label="Payment Amount" value={formatRp(row.nominal)} />
        <Field label="Due Date" value={formatTanggal(pax(detail.vendorDueDate))} />
        <AttachmentLink file={findAtt('vendor-invoice')} label="Invoice" onPreview={handlePreview} />
      </>
    );
  } else if (kategori === PAYMENT_KATEGORI.INDIVIDUAL) {
    body = (
      <>
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
        <Field label="Number of Participants" value={pax(detail.perDiemParticipants)} />
        <AttachmentLink file={findAtt('perdiem-file')} label="File with Participant Details" onPreview={handlePreview} />
      </>
    );
  }

  return (
    <>
      {open && (
        <Modal title={`Request Detail - ${row.idRequest}`} onClose={onClose} maxWidth="max-w-2xl" className="max-h-[92vh]">
          <div className="px-5 py-2 max-h-[70vh] overflow-y-auto bg-amana-neutral-100">
            <Field label="Requester" value={row.karyawan?.nama} />
            <Field
              label="Department / Practice Group"
              value={deptPracticeGroup}
            />
            <Field label="Role" value={pax(detail.role)} />
            <Field label="Partner" value={pax(detail.partner)} />
            <Field label="Payment Under" value={pax(detail.paymentUnder)} />
            <Field label="To Whom" value={row.masterKategoriPayment?.namaKategori ?? row.idKategoriPayment} />
            <Field label="Event / Vendor Name" value={row.projectID} />
            {body}
          </div>
        </Modal>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] bg-amana-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-amana-neutral-100 w-[95vw] max-w-6xl h-[92vh] rounded-2xl flex flex-col relative overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-amana-neutral-200 flex items-center justify-between bg-amana-neutral-100">
              <h4 className="font-semibold text-amana-neutral-700 truncate">{preview.name}</h4>
              <button onClick={() => setPreview(null)} className="text-amana-neutral-500 hover:text-amana-neutral-700 transition p-1 hover:bg-amana-neutral-200 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-amana-neutral-200">
              <iframe src={preview.url} className="w-full h-full" title={preview.name} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}