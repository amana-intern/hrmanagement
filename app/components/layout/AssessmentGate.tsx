'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import Button from '../forms/Button';

// Gerbang assessment pertama: selama assessment terbuka belum diselesaikan,
// semua halaman dashboard selain /user/assessment hanya menampilkan section warning.
export default function AssessmentGate({
  mustAssess,
  children,
}: {
  mustAssess: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Selama terkunci, paksa server components (termasuk DashboardLayout) dihitung
  // ulang setiap pindah halaman supaya flag mustAssess tidak basi — begitu submission
  // tersimpan, gerbang langsung terbuka tanpa perlu reload manual.
  useEffect(() => {
    if (mustAssess) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!mustAssess || pathname === '/user/assessment') {
    return <>{children}</>;
  }

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <SectionWarning onTake={() => router.push('/user/assessment')} />
    </div>
  );
}

function SectionWarning({ onTake }: { onTake: () => void }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="w-full max-w-xl bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-8 py-10 flex flex-col items-center text-center gap-4">
        <span className="w-16 h-16 rounded-full bg-amana-primary-100 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-amana-primary-500" />
        </span>
        <h2 className="text-[22px] font-semibold text-amana-primary-500">First Assessment Required</h2>
        <p className="text-[15px] text-amana-neutral-400 leading-relaxed">
          Please complete the competency assessment first before accessing other pages.
          Your submission unlocks the rest of the workspace automatically.
        </p>
        <Button variant="primary" size="lg" onClick={onTake}>
          Take Assessment
        </Button>
      </div>
    </div>
  );
}
