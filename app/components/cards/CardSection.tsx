import { ReactNode } from 'react';

export default function CardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-amana-blue rounded-full" />
        <h3 className="text-lg font-semibold text-amana-black">{title}</h3>
      </div>
      {children}
    </div>
  );
}
