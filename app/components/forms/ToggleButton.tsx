'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { springSnappy } from '@/app/utils/motion';

export type ToggleButtonColor = 'primary' | 'danger';

const colorStyle: Record<ToggleButtonColor, { rest: string; hover: string; text: string; border: string; ring: string; dot: string }> = {
  primary: {
    rest: 'bg-amana-primary-500 text-amana-neutral-100',
    hover: 'hover:bg-amana-primary-100 hover:text-amana-primary-500',
    text: 'text-amana-primary-500',
    border: 'border-amana-primary-500',
    ring: 'border-amana-primary-500',
    dot: 'bg-amana-primary-500',
  },
  danger: {
    rest: 'bg-amana-danger-500 text-amana-neutral-100',
    hover: 'hover:bg-amana-danger-100 hover:text-amana-danger-500',
    text: 'text-amana-danger-500',
    border: 'border-amana-danger-500',
    ring: 'border-amana-danger-500',
    dot: 'bg-amana-danger-500',
  },
};

export default function ToggleButton({
  children,
  color = 'primary',
  selected = false,
  disabled = false,
  onClick,
  className,
}: {
  children: React.ReactNode;
  color?: ToggleButtonColor;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const style = colorStyle[color];
  const isPrimary = color === 'primary';
  const showSlot = !disabled && (selected || hovered);

  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      transition={springSnappy}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2.5 rounded-[5px] text-[16px] font-semibold whitespace-nowrap border border-transparent',
        disabled
          ? 'bg-amana-neutral-200 text-amana-neutral-300 cursor-not-allowed'
          : selected
            ? cn('bg-amana-neutral-100', style.text, style.border)
            : cn(style.rest, style.hover, 'cursor-pointer'),
        className
      )}
    >
      <span>{children}</span>

      {!disabled && (
        <span
          className={cn(
            'relative h-[26px] flex-shrink-0 overflow-hidden transition-all duration-200 ease-out',
            showSlot ? 'w-[26px] ml-2.5' : 'w-0 ml-0'
          )}
        >
          {isPrimary ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/toggle-hover-ring.svg"
                alt=""
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[19.5px] h-[19.5px]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/toggle-selected-dot.svg"
                alt=""
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[9.75px] h-[9.75px] transition-all duration-200 ease-out',
                  selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                )}
              />
            </>
          ) : (
            <>
              <span
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[19.5px] h-[19.5px] rounded-full border-2',
                  style.ring
                )}
              />
              <span
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[9.75px] h-[9.75px] rounded-full transition-all duration-200 ease-out',
                  style.dot,
                  selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                )}
              />
            </>
          )}
        </span>
      )}
    </motion.button>
  );
}