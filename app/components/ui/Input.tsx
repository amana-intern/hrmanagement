import { InputHTMLAttributes, type ReactNode } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl outline-none text-sm font-normal transition-all duration-200 text-amana-black shadow-sm
                  focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15
                  hover:border-amana-sec-7/30
                  placeholder:text-amana-sec-7/60
                  ${props.className || ''}`}
    />
  );
}

export function Select(props: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl outline-none text-sm font-normal transition-all duration-200 text-amana-black shadow-sm appearance-none cursor-pointer
                  focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15
                  hover:border-amana-sec-7/30
                  ${props.className || ''}`}
    />
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-semibold text-amana-black mb-1.5 ${className || ''}`}>
      {children}
    </label>
  );
}
