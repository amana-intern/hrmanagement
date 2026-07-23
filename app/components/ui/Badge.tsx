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

const dotColors: Record<BadgeVariant, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  info: 'bg-sky-500',
  default: 'bg-zinc-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export default function Badge({ children, variant = 'default', pulse }: { children: ReactNode; variant?: BadgeVariant; pulse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        variantStyles[variant]
      } ${variant === 'pending' || pulse ? 'animate-pulse-glow' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      {children}
    </span>
  );
}
