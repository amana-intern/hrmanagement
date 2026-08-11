'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Upload, FileText, Eye } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import Modal from '../feedback/Modal';

/**
 * Matches Figma's "Upload Hover" component: amana-white background by default,
 * switching to a light blue fill (`amana-primary-100`) with blue label text
 * (`amana-primary-500`) on hover — the icon stays blue in both states.
 *
 * Once a file is selected, the box switches out of the upload prompt into a
 * "selected" state with a View action, so people can actually confirm what they
 * just uploaded instead of just trusting a filename string.
 */
export default function UploadBox({
  file,
  placeholder,
  onFileSelect,
  accept = 'application/pdf',
  className,
}: {
  file: File | null;
  placeholder: string;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  className?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <>
      <div
        className={cn(
          'group relative flex h-56 flex-col items-center justify-center gap-2.5 rounded-[5px] border border-amana-primary-500 bg-amana-neutral-100 cursor-pointer overflow-hidden transition-colors duration-200 hover:bg-amana-primary-100',
          className
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        {file ? (
          <>
            <FileText className="h-11 w-11 text-amana-primary-500" strokeWidth={1.5} />
            <p className="max-w-[85%] truncate text-[16px] text-center text-amana-neutral-500 transition-colors duration-200 group-hover:text-amana-primary-500">
              {file.name}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPreviewOpen(true);
              }}
              className="relative z-20 inline-flex items-center gap-1.5 rounded-lg border border-amana-primary-500 bg-amana-neutral-100 px-4 py-1.5 text-[13px] font-semibold text-amana-primary-500 hover:bg-amana-primary-500 hover:text-amana-neutral-100 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
          </>
        ) : (
          <>
            <Upload className="h-11 w-11 text-amana-primary-500" strokeWidth={1.5} />
            <p className="text-[16px] text-center text-amana-neutral-500 transition-colors duration-200 group-hover:text-amana-primary-500">
              {placeholder}
            </p>
          </>
        )}
      </div>

      <AnimatePresence>
        {previewOpen && file && previewUrl && (
          <Modal title={file.name} onClose={() => setPreviewOpen(false)} maxWidth="max-w-3xl" className="h-[80vh]">
            <div className="flex-1 p-4">
              {file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={file.name} className="h-full w-full rounded-[13px] border border-amana-neutral-300 object-contain" />
              ) : (
                <iframe src={previewUrl} className="h-full w-full rounded-[13px] border border-amana-neutral-300" title={file.name} />
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
