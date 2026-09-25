'use client';

import { ReactNode } from 'react';
import Modal from './Modal';
import StatusPill from '../data-display/StatusPill';

/** Figma node 1073:2422 — one label / right-aligned value row with a divider. */
export function DetailRow({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  const content = children ?? value;
  if (content === null || content === undefined || content === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-amana-neutral-300">
      <span className="text-[16px] font-semibold text-amana-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-[16px] text-right break-words min-w-0 text-amana-neutral-500">{content}</span>
    </div>
  );
}

/**
 * Shared layout for every "details" popup (submission, leave, sick leave, ...):
 * Status + reason/notes on top, then a "Details" section with the remaining rows.
 */
export default function DetailModal({
  title,
  onClose,
  status,
  topFields = [],
  maxWidth = 'max-w-2xl',
  zIndex,
  children,
}: {
  title: string;
  onClose: () => void;
  status?: { label: string; color: string } | null;
  /** Shown right under Status and above "Details" — e.g. Rejection Reason. */
  topFields?: { label: string; value?: string | null }[];
  maxWidth?: string;
  zIndex?: number;
  children: ReactNode;
}) {
  return (
    <Modal title={title} onClose={onClose} maxWidth={maxWidth} zIndex={zIndex} className="max-h-[92vh]">
      <div className="px-5 pb-3 flex-1 min-h-0 overflow-y-auto bg-amana-neutral-100">
        {status && (
          <DetailRow label="Status">
            <StatusPill color={status.color} fullWidth={false}>
              {status.label}
            </StatusPill>
          </DetailRow>
        )}
        {topFields.map((f) => (
          <DetailRow key={f.label} label={f.label} value={f.value} />
        ))}
        <h3 className="mt-3 pb-1 mb-1 text-[24px] font-semibold italic text-amana-primary-500 border-b border-amana-primary-500">
          Details
        </h3>
        {children}
      </div>
    </Modal>
  );
}
