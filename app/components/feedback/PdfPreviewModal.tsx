'use client';

import Modal from './Modal';

export interface PdfPreviewTarget {
  title: string;
  url: string;
}

export default function PdfPreviewModal({
  target,
  onClose,
}: {
  target: PdfPreviewTarget | null;
  onClose: () => void;
}) {
  if (!target) return null;
  return (
    <Modal title={target.title} onClose={onClose} maxWidth="max-w-3xl" className="h-[80vh]">
      <div className="flex-1 p-4">
        <iframe
          src={target.url}
          className="h-full w-full rounded-[5px] border border-amana-neutral-300"
          title={target.title}
        />
      </div>
    </Modal>
  );
}
