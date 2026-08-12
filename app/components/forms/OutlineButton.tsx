'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { springSnappy } from '@/app/utils/motion';

/** Outline variant matching the primary Button's footprint, for actions like Cancel / Save Draft that sit alongside a primary action. */
export default function OutlineButton({
  className,
  type = 'button',
  disabled,
  ...props
}: Omit<HTMLMotionProps<'button'>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'ref'>) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05, y: -3 } : {}}
      whileTap={!disabled ? { scale: 0.94, y: 0 } : {}}
      transition={springSnappy}
      className={cn(
        'px-8 py-3 rounded-lg border border-amana-primary-500 bg-amana-neutral-100 text-amana-primary-500 font-semibold text-base hover:bg-amana-primary-500 hover:text-amana-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amana-neutral-100 disabled:hover:text-amana-primary-500',
        className
      )}
      {...props}
    />
  );
}
