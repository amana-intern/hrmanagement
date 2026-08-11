'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { springSoft, springSnappy, durationSlow, durationFast, easeOut } from '@/app/utils/motion';

export default function Modal({
  title,
  onClose,
  maxWidth = 'max-w-2xl',
  zIndex = 50,
  className,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Tailwind max-width class for the dialog, e.g. 'max-w-md', 'max-w-3xl'. */
  maxWidth?: string;
  zIndex?: number;
  /** Extra classes on the dialog container, e.g. 'max-h-[90vh]' or 'h-[80vh]'. */
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      <motion.div
        className="absolute inset-0 bg-amana-neutral-500/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : durationSlow }}
      />
      <motion.div
        className={cn(
          'relative w-full flex flex-col bg-amana-neutral-100 rounded-[10px] border border-amana-primary-500 shadow-lg overflow-hidden',
          maxWidth,
          className
        )}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: reduceMotion ? { duration: 0.2 } : springSoft,
        }}
        exit={{
          opacity: 0,
          y: 12,
          scale: 0.97,
          transition: reduceMotion ? { duration: 0.2 } : { duration: durationFast, ease: easeOut },
        }}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-amana-primary-500">
          <h2 className="text-[24px] font-semibold text-amana-primary-500">{title}</h2>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            className="text-amana-primary-500 hover:text-amana-danger-500"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
