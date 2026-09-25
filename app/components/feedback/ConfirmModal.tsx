'use client';

import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from '../forms/Button';
import { cn } from '@/app/utils/cn';

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  loadingLabel,
  loading = false,
  /** 'danger' (default) for destructive actions; 'primary' for a neutral/positive confirmation (e.g. Renewal). */
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  loadingLabel?: string;
  loading?: boolean;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md" showCloseButton={false}>
      <div className="p-5 flex flex-col items-center text-center gap-3">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', tone === 'primary' ? 'bg-amana-success-100' : 'bg-amana-danger-100')}>
          <AlertTriangle className={cn('w-6 h-6', tone === 'primary' ? 'text-amana-success-500' : 'text-amana-danger-500')} />
        </div>
        <p className="text-[16px] text-amana-neutral-500">{message}</p>
        <div className="flex gap-3 w-full pt-2">
          <Button variant={tone === 'primary' ? 'primary' : 'danger'} size="lg" className="flex-1" isLoading={loading} onClick={onConfirm}>
            {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          </Button>
          <Button variant="outline" size="lg" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
