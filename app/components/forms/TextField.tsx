'use client';

import { ReactNode } from 'react';

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[16px] font-semibold text-amana-neutral-500">
        {label}
        {suffix}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
      />
    </div>
  );
}
