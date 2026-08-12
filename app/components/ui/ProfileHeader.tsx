'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from './index';
import { logout } from '@/lib/useAuth';
import NotificationBell from './NotificationBell';

type Me = {
  nama: string;
  email: string;
  noTelepon: string | null;
  roleLabel: string;
  departmentLabel: string | null;
  rolesDivisi: string;
  grade: string | null;
  displayGrade: string;
  department: string | null;
  leave?: { sisaCuti: number | null; accrued: number | null; carryOver: number | null };
  stats?: { pendingLeaves: number; sickLeaves: number; pendingPayments: number; certificates: number };
};

type ProfileHeaderProps = {
  sidebar: ReactNode;
  greetingFallback: string;
  gradeFallback: string;
  /** Pakai departmentLabel (bukan rolesDivisi) sebagai baris kedua — untuk halaman Partner. */
  useDepartmentLine?: boolean;
  /** Render prop untuk konten tambahan di bawah header (mis. ringkasan statistik). */
  children?: (me: Me | null) => ReactNode;
};

export default function ProfileHeader({
  sidebar,
  greetingFallback,
  gradeFallback,
  useDepartmentLine = false,
  children,
}: ProfileHeaderProps) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/me', { cache: 'no-store' });
      if (res.ok) setMe((await res.json()).user);
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const roleLine = useDepartmentLine
    ? me?.departmentLabel ?? me?.roleLabel ?? '-'
    : me?.rolesDivisi ?? '-';

  return (
    <PageLayout sidebar={sidebar}>
      <div className="bg-white border border-amana-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-6 items-stretch">
          <div className="w-40 aspect-[4/5] bg-amana-primary-200/10 border border-amana-neutral-200 rounded-2xl flex-shrink-0 overflow-hidden">
            <img src="/PlaceHolderPP.png" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-amana-primary-500 tracking-tight">
              Hello, {me?.nama ?? greetingFallback}!
            </h1>
            <div className="bg-white border border-amana-neutral-200 rounded-xl p-4 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-amana-primary-500">{me?.displayGrade ?? gradeFallback}</h2>
              <p className="text-base font-medium text-amana-neutral-400">{roleLine}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="bg-amana-primary-500 text-white text-xs font-bold py-2 px-5 rounded-xl uppercase tracking-wider hover:opacity-80 transition-all"
          >
            Logout
          </button>
        </div>

        {children ? children(me) : null}
      </div>
    </PageLayout>
  );
}