'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from '../forms/Button';

export default function RejectReasonModal({
  title = 'Reject Request',
  onCancel,
  onConfirm,
  submitting = false,
}: {
  title?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[16px] font-semibold text-amana-neutral-500">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Tell us why this request is being rejected..."
            className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            disabled={submitting || !reason.trim()}
            onClick={() => onConfirm(reason)}
          >
            {submitting ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
