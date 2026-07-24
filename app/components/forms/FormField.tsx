import type { ReactNode } from 'react';
import { Label } from './Input';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  helperText?: string;
  error?: string;
  labelClassName?: string;
}

export default function FormField({ label, children, helperText, error, labelClassName }: FormFieldProps) {
  return (
    <div>
      <Label className={labelClassName}>{label}</Label>
      {children}
      {helperText && <p className="text-xs text-amana-sec-7 mt-1 font-light">{helperText}</p>}
      {error && <p className="text-xs text-rose-500 mt-1 font-semibold">{error}</p>}
    </div>
  );
}
