import { InputHTMLAttributes, type ReactNode } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 bg-white border border-amana-neutral-200 rounded-xl outline-none text-sm font-normal transition-all duration-200 text-amana-neutral-500 shadow-sm
                  focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15
                  hover:border-amana-neutral-400/30
                  placeholder:text-amana-neutral-400/60
                  ${props.className || ''}`}
    />
  );
}

export function Select(props: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 bg-white border border-amana-neutral-200 rounded-xl outline-none text-sm font-normal transition-all duration-200 text-amana-neutral-500 shadow-sm appearance-none cursor-pointer
                  focus:border-amana-primary-500 focus:ring-2 focus:ring-amana-primary-500/15
                  hover:border-amana-neutral-400/30
                  ${props.className || ''}`}
    />
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-semibold text-amana-neutral-500 mb-1.5 ${className || ''}`}>
      {children}
    </label>
  );
}
