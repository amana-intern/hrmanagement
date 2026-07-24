import { ReactNode } from 'react';

export default function PageLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-amana-white via-white to-amana-sec-2/20 font-sans">
      {sidebar}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
