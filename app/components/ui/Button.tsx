import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  href?: string;
}

const base =
  'px-5 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 select-none';

const variants: Record<string, string> = {
  primary:
    'bg-amana-blue text-white shadow-md shadow-amana-blue/20 hover:shadow-lg hover:shadow-amana-blue/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
  secondary:
    'border border-amana-blue text-amana-blue hover:bg-amana-blue/5 hover:shadow-md hover:shadow-amana-blue/10 hover:-translate-y-0.5 active:translate-y-0',
  danger:
    'bg-amana-sec-5 text-white shadow-md shadow-amana-sec-5/20 hover:shadow-lg hover:shadow-amana-sec-5/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
  ghost:
    'text-amana-sec-7 hover:text-amana-blue hover:bg-amana-blue/5',
};

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  className = '',
}: ButtonProps) {
  const disabledStyles = disabled
    ? 'bg-amana-sec-6 text-amana-sec-7 cursor-not-allowed shadow-none hover:shadow-none hover:translate-y-0'
    : 'cursor-pointer transition-all duration-200';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}
