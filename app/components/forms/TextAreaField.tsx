'use client';

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[16px] font-semibold text-amana-neutral-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className="w-full border border-amana-neutral-300 rounded-[13px] px-3 py-2.5 text-[16px] text-amana-neutral-500 placeholder:text-amana-neutral-300 bg-amana-neutral-100 transition-colors duration-200 focus:outline-none focus:border-amana-primary-500 resize-none disabled:bg-amana-neutral-200 disabled:text-amana-neutral-400 disabled:cursor-not-allowed"
      />
    </div>
  );
}
