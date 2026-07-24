import type { ReactNode } from 'react';

type BadgeVariant = 'pending' | 'approved' | 'rejected' | 'info' | 'default' | 'success' | 'warning' | 'danger';

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  default: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Badge({ children, variant = 'default', pulse }: { children: ReactNode; variant?: BadgeVariant; pulse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-xs font-semibold px-2.5 py-1 rounded-full border min-w-[120px] ${
        variantStyles[variant]
      } ${variant === 'pending' || pulse ? 'animate-pulse-glow' : ''}`}
    >
      {children}
    </span>
  );
}
