import type { ReactNode } from 'react';

export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end mb-2 text-sm text-amana-black font-semibold">
      <span className="border-b border-amana-black px-1 pb-1">{children}</span>
    </div>
  );
}
