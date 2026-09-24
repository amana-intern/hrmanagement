'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface StatusState {
  ok: boolean;
  text: string;
}

const AUTO_DISMISS_MS = 7000;

/** Auto-dismissing top-right toast for success/error feedback (Figma node 710:2945). */
export default function StatusModal({
  state,
  onClose,
}: {
  state: StatusState | null;
  onClose: () => void;
}) {
  // Callers pass a fresh `() => setStatus(null)` closure on every render, so the
  // effect below only depends on `state` — otherwise an unrelated parent re-render
  // would swap `onClose` and restart the timer, and the toast would never dismiss.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!state) return;
    const id = setTimeout(() => onCloseRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [state]);

  if (!state) return null;

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <motion.div
        key={state.text}
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'flex items-start gap-3 w-[380px] max-w-[90vw] bg-white border rounded-[7px] px-4 py-3',
          'shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]',
          state.ok ? 'border-amana-success-500' : 'border-amana-danger-500'
        )}
      >
        {state.ok ? (
          <CheckCircle2 className="w-7 h-7 text-amana-success-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-7 h-7 text-amana-danger-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-2 pt-0.5">
          <p className={cn('text-[16px] leading-snug', state.ok ? 'text-amana-success-500' : 'text-amana-danger-500')}>
            {state.text}
          </p>
          <div className="h-[6px] w-full rounded-full bg-amana-neutral-100 overflow-hidden flex justify-end">
            <motion.div
              key={state.text}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              className={cn('h-full rounded-full', state.ok ? 'bg-amana-success-500' : 'bg-amana-danger-500')}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
