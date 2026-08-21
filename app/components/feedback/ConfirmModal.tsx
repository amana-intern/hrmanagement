'use client';

import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from '../forms/Button';

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  loadingLabel,
  loading = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  loadingLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="p-5 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-amana-danger-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amana-danger-500" />
        </div>
        <p className="text-[16px] text-amana-neutral-500">{message}</p>
        <div className="flex gap-3 w-full pt-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="lg" className="flex-1" disabled={loading} onClick={onConfirm}>
            {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
