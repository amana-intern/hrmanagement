'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/utils/cn';
import { motion, HTMLMotionProps } from 'framer-motion';
import { springSnappy } from '@/app/utils/motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag" | "ref"> {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Default (solid) -> hover (soft tint) -> active/clicked (light + outline) -> disabled (gray), per the AMANA button spec.
const variants = {
  primary:
    'bg-amana-primary-500 text-amana-neutral-100 border-amana-primary-500 hover:bg-amana-primary-100 hover:text-amana-primary-500 hover:border-amana-primary-100 active:bg-amana-neutral-100 active:text-amana-primary-500 active:border-amana-primary-500',
  danger:
    'bg-amana-danger-500 text-amana-neutral-100 border-amana-danger-500 hover:bg-amana-danger-100 hover:text-amana-danger-500 hover:border-amana-danger-100 active:bg-amana-neutral-100 active:text-amana-danger-500 active:border-amana-danger-500',
  ghost:
    'border-transparent text-amana-neutral-500 hover:text-amana-primary-500 hover:bg-amana-primary-50',
  // The reverse of `primary`: outlined/light by default, flips to solid on hover — for a secondary action paired next to a primary one (e.g. Previous next to Next).
  outline:
    'bg-amana-neutral-100 text-amana-primary-500 border-amana-primary-500 hover:bg-amana-primary-500 hover:text-amana-neutral-100 hover:border-amana-primary-500 active:bg-amana-primary-100 active:text-amana-primary-500 active:border-amana-primary-100',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={!(disabled || isLoading) ? { scale: 0.94 } : {}}
      transition={springSnappy}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold select-none outline-none focus-visible:ring-4 focus-visible:ring-amana-primary-500/30 border',
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'bg-amana-neutral-100 text-amana-neutral-300 border-amana-neutral-300 cursor-not-allowed pointer-events-none shadow-none',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
}
