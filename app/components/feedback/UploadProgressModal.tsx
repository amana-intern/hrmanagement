'use client';

import Modal from './Modal';
import { cn } from '@/app/utils/cn';

/** Figma node 956:2605 — bar stays light blue while transferring, switches to full amana blue once actually done. */
export default function UploadProgressModal({
  open,
  percent,
  label = 'Uploading Document...',
}: {
  open: boolean;
  percent: number;
  label?: string;
}) {
  if (!open) return null;
  const pct = Math.min(100, Math.max(0, percent));
  const done = pct >= 100;

  return (
    <Modal title="Upload" onClose={() => {}} maxWidth="max-w-md" showCloseButton={false} zIndex={70}>
      <div className="p-5">
        <div className="flex flex-col items-center gap-5 rounded-[5px] border border-amana-primary-500 px-4 py-6">
          <p className="text-[16px] text-amana-primary-500 text-center">
            {done ? 'Upload Complete' : label}
          </p>
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-[10px] rounded-full bg-amana-neutral-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-[width] duration-150 ease-out', done ? 'bg-amana-primary-500' : 'bg-amana-primary-300')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn('text-[16px] w-11 text-right tabular-nums', done ? 'text-amana-primary-500' : 'text-amana-primary-300')}>
              {pct}%
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
