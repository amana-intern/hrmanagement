'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { logout } from '@/lib/useAuth';
import ConfirmModal from '../feedback/ConfirmModal';

export interface NavLink {
  href: string;
  label: string;
  /** Extra pathnames that should also light up this link (e.g. a result page reached from it). */
  activePaths?: string[];
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

export default function SidebarNavBase({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (link: NavLink) => pathname === link.href || !!link.activePaths?.includes(pathname);

  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pillRect, setPillRect] = useState<{ top: number; height: number } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  useEffect(() => {
    const activeLink = groups.flatMap((g) => g.links).find((l) => isActive(l));
    const el = activeLink ? linkRefs.current[activeLink.href] : null;
    setPillRect(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, groups]);

  return (
    <div className="h-screen w-[200px] md:w-[220px] lg:w-[230px] xl:w-[250px] 2xl:w-[270px] flex-shrink-0 bg-amana-primary-500 p-[10px] flex flex-col items-center overflow-y-auto scroll-smooth shadow-[0px_4px_4px_0px_rgba(30,30,30,0.25)]">
      <div className="flex flex-col items-center w-full flex-shrink-0 mb-[30px]">
        <h1 className="text-[50.59px] leading-none font-light text-amana-neutral-100 text-center">AMANA</h1>
        <div className="w-full border-t border-amana-neutral-100 mt-3 mb-1.5" />
        <p className="text-[13.53px] font-semibold text-amana-neutral-100 text-center">Core Administrative System</p>
      </div>

      <div ref={navRef} className="relative w-full flex-1">
        {pillRect && (
          <div
            aria-hidden
            className="absolute left-0 right-0 bg-amana-neutral-100 border border-amana-primary-500 rounded-[8px] transition-[top,height] duration-200 ease-out pointer-events-none"
            style={{ top: pillRect.top, height: pillRect.height }}
          />
        )}

        {groups.map((group) => (
          <div key={group.title} className="flex flex-col items-start w-full flex-shrink-0 mb-[30px]">
            <div className="flex flex-col items-start w-full mb-[5px]">
              <p className="text-[20px] font-normal text-amana-neutral-100 w-full">{group.title}</p>
              <div className="w-full border-t border-amana-neutral-100 mt-1" />
            </div>
            {group.links.map((link) => {
              const active = isActive(link);
              return (
                <Link
                  key={link.href}
                  ref={(el) => {
                    linkRefs.current[link.href] = el;
                  }}
                  href={link.href}
                  className={cn(
                    'group relative z-10 flex items-center justify-center h-[30px] w-full rounded-[8px] px-[5px] border border-transparent overflow-hidden mb-[5px] last:mb-0',
                    !active && 'hover:bg-amana-primary-100'
                  )}
                >
                  <span
                    className={cn(
                      'relative z-10 flex-1 text-[18px] font-semibold mr-[10px]',
                      active ? 'text-amana-primary-500' : 'text-amana-neutral-100 group-hover:text-amana-primary-500'
                    )}
                  >
                    {link.label}
                  </span>
                  <span className="relative z-10 w-5 h-5 flex-shrink-0">
                    {!active && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/icons/toggle-hover-ring.svg"
                        alt=""
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[19.5px] h-[19.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    )}
                    {active && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icons/toggle-selected-ring.svg"
                          alt=""
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[19.5px] h-[19.5px]"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icons/toggle-selected-dot.svg"
                          alt=""
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[9.75px] h-[9.75px]"
                        />
                      </>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="w-full border-t border-amana-neutral-100 mt-1.5 mb-1.5 flex-shrink-0" />

      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        disabled={loggingOut}
        className="flex-shrink-0 flex items-center justify-center gap-2 h-[36px] w-full rounded-[8px] text-[16px] font-semibold text-amana-neutral-100 hover:bg-amana-primary-100 hover:text-amana-primary-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? 'Logging out...' : 'Logout'}
      </button>

      <AnimatePresence>
        {confirmLogout && (
          <ConfirmModal
            title="Logout"
            message="Are you sure you want to log out?"
            confirmLabel="Logout"
            loadingLabel="Logging out..."
            loading={loggingOut}
            onConfirm={handleLogout}
            onCancel={() => setConfirmLogout(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
