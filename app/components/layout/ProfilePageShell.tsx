import type { ReactNode } from 'react';
import { ProfileCard, StatCard } from '../cards';

interface Stat {
  value: string | number;
  label: string;
  color?: string;
}

export default function ProfilePageShell({
  sidebar,
  greeting,
  title,
  subtitle,
  footer,
  stats,
}: {
  sidebar: ReactNode;
  greeting: string;
  title: string;
  subtitle: string;
  footer: string;
  stats: Stat[];
}) {
  return (
    <div className="flex w-full min-h-screen bg-gradient-to-br from-amana-white via-white to-amana-sec-2/20 font-sans">
      {sidebar}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-6">
          <ProfileCard
            greeting={greeting}
            title={title}
            subtitle={subtitle}
            footer={footer}
          >
            <h3 className="text-xl font-semibold text-amana-black mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <StatCard key={idx} value={stat.value} label={stat.label} color={stat.color} delay={((idx + 1) * 100) as 100 | 200 | 300 | 400} />
              ))}
            </div>
          </ProfileCard>
        </div>
      </main>
    </div>
  );
}
