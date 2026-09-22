'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { springSnappy } from '@/app/utils/motion';

export interface StatusState {
  ok: boolean;
  text: string;
}

const AUTO_DISMISS_MS = 3500;

/** Non-blocking auto-dismissing toast for success/error feedback (e.g. after submit/reject). */
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
    <div className="fixed bottom-6 right-6 z-[100]">
      <motion.div
        key={state.text}
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springSnappy}
        className={cn(
          'flex items-center gap-3 w-[340px] max-w-[90vw] bg-amana-neutral-100 border rounded-[5px] shadow-lg px-4 py-3',
          state.ok ? 'border-amana-success-500' : 'border-amana-danger-500'
        )}
      >
        {state.ok ? (
          <CheckCircle2 className="w-5 h-5 text-amana-success-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-amana-danger-500 flex-shrink-0" />
        )}
        <p className="flex-1 min-w-0 text-[14px] text-amana-neutral-500">{state.text}</p>
      </motion.div>
    </div>
  );
}
