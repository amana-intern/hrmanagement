'use client';

import { ChevronDown } from 'lucide-react';

export default function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = 'Select...',
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
  placeholder?: string;
  /** Optional display label per option value (e.g. for meta values like "__other__"). */
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 pr-9 text-[16px] text-amana-neutral-500 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 disabled:text-amana-neutral-300 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {labels ? labels[o] ?? o : o}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-amana-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
