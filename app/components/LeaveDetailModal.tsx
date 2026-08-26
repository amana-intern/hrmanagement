'use client';

import { useState } from 'react';
import Modal from './feedback/Modal';
import PdfPreviewModal, { PdfPreviewTarget } from './feedback/PdfPreviewModal';
import Button from './forms/Button';

export interface LeaveDetailRow {
  idCuti: string;
  name: string;
  department: string;
  grade: string;
  type: string;
  dates: string;
  jumlahHari?: number | null;
  tanggalPengajuan?: string | null;
  keterangan?: string | null;
  catatan?: string | null;
  gejala?: string | null;
  buktiSakitURL?: string | null;
  jenis: 'cuti' | 'sakit';
}

interface LeaveDetailModalProps {
  row: LeaveDetailRow | null;
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

function formatTanggal(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeaveDetailModal({ row, open, onClose }: LeaveDetailModalProps) {
  const [preview, setPreview] = useState<PdfPreviewTarget | null>(null);

  if (!row) return null;
  const isSick = row.jenis === 'sakit';

  return (
    <>
      {open && (
        <Modal title={`Detail Pengajuan - ${row.idCuti}`} onClose={onClose} maxWidth="max-w-2xl" className="max-h-[92vh]">
          <div className="px-5 py-2 max-h-[70vh] overflow-y-auto bg-amana-neutral-100">
            <Field label="Name" value={row.name} />
            <Field label="Department" value={row.department} />
            <Field label="Grade" value={row.grade} />
            <Field label={isSick ? 'Type' : 'Leave Type'} value={row.type} />
            <Field label="Dates" value={row.dates} />
            <Field label="Number of Days" value={row.jumlahHari} />
            <Field label="Submitted On" value={formatTanggal(row.tanggalPengajuan)} />
            {isSick ? (
              <Field label="Symptoms" value={row.gejala} />
            ) : (
              <>
                <Field label="Reason" value={row.keterangan} />
                <Field label="Notes" value={row.catatan} />
              </>
            )}
            {isSick && (
              <div className="py-2.5 border-b border-amana-neutral-200 last:border-0">
                <p className="text-xs font-medium text-amana-neutral-500 mb-1">Medical Certificate</p>
                {row.buktiSakitURL ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreview({ url: row.buktiSakitURL!, title: `${row.name} - Sick Note` })}
                  >
                    View Document
                  </Button>
                ) : (
                  <p className="text-sm text-amana-neutral-400 italic">No attachment</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      <PdfPreviewModal target={preview} onClose={() => setPreview(null)} />
    </>
  );
}
