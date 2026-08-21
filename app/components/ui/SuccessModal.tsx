import { ReactNode, useEffect, useRef, useState } from 'react';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: ReactNode;
  autoCloseMs?: number;
  dismissLabel?: string;
}

export default function SuccessModal({
  open,
  onClose,
  title = 'Success!',
  message,
  autoCloseMs = 4000,
  dismissLabel = 'OK',
}: SuccessModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
    }
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      if (autoCloseMs > 0) {
        autoTimer.current = setTimeout(onClose, autoCloseMs);
      }
    } else if (visible) {
      closeTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        document.body.style.overflow = '';
      }, 260);
    }
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open, visible, autoCloseMs, onClose]);

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      document.body.style.overflow = '';
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${
          closing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${
          closing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
          <div className="relative w-20 h-20 mb-5">
            <svg viewBox="0 0 52 52" className="w-20 h-20">
              <circle
                cx="26"
                cy="26"
                r="24"
                fill="none"
                strokeWidth="3"
                className="animate-circle-pop text-emerald-500"
                stroke="currentColor"
                strokeLinecap="round"
              />
              <path
                fill="none"
                strokeWidth="3.5"
                stroke="currentColor"
                className="animate-check-draw text-emerald-500"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27 l8 8 l16 -17"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-amana-neutral-500">{title}</h2>
          {message && (
            <div className="mt-2 text-sm text-amana-neutral-400 leading-relaxed break-words">{message}</div>
          )}
        </div>
        <div className="px-8 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-amana-primary-500 text-white shadow-md shadow-amana-primary-500/20 hover:shadow-lg hover:shadow-amana-primary-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
