'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import Modal from './Modal';
import Button from '../forms/Button';

export interface ReviewField {
  label: string;
  value?: ReactNode;
}

export interface ReviewFileItem {
  label: string;
  file: File | null;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function FilePreview({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const isImage = /\.(jpe?g|png)$/i.test(file.name);
  const isPdf = /\.pdf$/i.test(file.name);

  return (
    <div className="rounded-[8px] border border-amana-neutral-300 bg-amana-neutral-100 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-medium text-amana-neutral-500 truncate">{file.name}</span>
        <span className="text-[12px] text-amana-neutral-400 flex-shrink-0">{formatSize(file.size)}</span>
      </div>
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="max-h-64 w-auto mx-auto rounded border border-amana-neutral-300 object-contain" />
      )}
      {!isImage && isPdf && <iframe src={url} title={file.name} className="h-64 w-full rounded border border-amana-neutral-300" />}
      {!isImage && !isPdf && <p className="text-[13px] text-amana-neutral-400">Preview not available for this file type.</p>}
    </div>
  );
}

/**
 * Review sebelum submit: menampilkan seluruh input user (fields) + preview file
 * yang di-attach (client-side blob URL), lalu tombol Submit/Cancel.
 * Dipakai halaman submit-mutasi (leave, sick leave, payment) agar bisa crosscheck
 * sebelum request benar-benar dikirim.
 */
export default function SubmitReviewModal({
  title,
  fields,
  files = [],
  confirmLabel = 'Submit',
  loadingLabel,
  loading = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  fields: ReviewField[];
  files?: ReviewFileItem[];
  confirmLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const visibleFields = fields.filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-lg" className="max-h-[85vh]">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-5 py-4 flex flex-col gap-4">
        {visibleFields.length > 0 && (
          <div className="flex flex-col">
            {visibleFields.map((f, i) => (
              <div key={i} className="flex flex-col gap-0.5 py-2.5 border-b border-amana-neutral-200 last:border-b-0">
                <span className="text-[13px] font-semibold text-amana-neutral-400">{f.label}</span>
                <span className="text-[15px] text-amana-neutral-500 whitespace-pre-wrap break-words">{f.value}</span>
              </div>
            ))}
          </div>
        )}
        {files.some((f) => f.file) && (
          <div className="flex flex-col gap-3">
            <span className="text-[16px] font-semibold text-amana-neutral-500">Attached File(s)</span>
            {files.map((f, i) =>
              f.file ? (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[13px] font-semibold text-amana-neutral-400">{f.label}</span>
                  <FilePreview file={f.file} />
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-4 border-t border-amana-neutral-200">
        <Button variant="outline" size="lg" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" isLoading={loading} onClick={onConfirm}>
          {loading && loadingLabel ? loadingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
