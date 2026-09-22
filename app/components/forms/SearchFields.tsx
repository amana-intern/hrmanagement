'use client';

import { ChevronDown } from 'lucide-react';

export function SearchTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
      />
    </div>
  );
}

export function SearchSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-amana-neutral-300 rounded-[8px] px-3 py-2.5 pr-9 text-[16px] text-amana-neutral-500 bg-transparent transition-colors duration-200 focus:outline-none focus:border-amana-primary-500"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-amana-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
