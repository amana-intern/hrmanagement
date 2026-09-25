'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface StatusState {
  ok: boolean;
  text: string;
}

const AUTO_DISMISS_MS = 7000;

/**
 * Top-right toast for success/error feedback (Figma "Toast Design": success 1044:7928, error 956:2598).
 * Shows for 7 seconds every time a new state is set (even with identical text), or until the user clicks X.
 */
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

  // Bumps on every new state object, so the timer + progress bar restart even when the message text repeats.
  const [seq, setSeq] = useState(0);
  useEffect(() => {
    if (!state) return;
    setSeq((n) => n + 1);
    const id = setTimeout(() => onCloseRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [state]);

  if (!state) return null;

  const tone = state.ok
    ? { border: 'border-amana-success-500', text: 'text-amana-success-500', fill: 'bg-amana-success-500' }
    : { border: 'border-amana-danger-500', text: 'text-amana-danger-500', fill: 'bg-amana-danger-500' };

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <motion.div
        key={seq}
        role={state.ok ? 'status' : 'alert'}
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'flex items-start gap-[10px] w-[520px] max-w-[92vw] bg-white border rounded-[7px] px-4 py-[10px]',
          'shadow-[0px_4px_4px_0px_rgba(0,0,0,0.6)]',
          tone.border
        )}
      >
        <div className="self-stretch flex items-center justify-center flex-shrink-0">
          {state.ok ? (
            <CheckCircle2 className={cn('w-10 h-10', tone.text)} strokeWidth={1.5} />
          ) : (
            <XCircle className={cn('w-10 h-10', tone.text)} strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
          <div className="flex items-start gap-[10px]">
            <p className={cn('flex-1 min-w-0 text-[16px] leading-snug break-words', tone.text)}>{state.text}</p>
            <button
              type="button"
              aria-label="Close notification"
              onClick={() => onCloseRef.current()}
              className={cn('flex-shrink-0 p-0.5 rounded hover:bg-amana-primary-100 transition-colors', tone.text)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[10px] w-full rounded-full bg-amana-neutral-100 overflow-hidden flex justify-end">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              className={cn('h-full rounded-full', tone.fill)}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
