'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemConfig {
  type: 'item';
  href: string;
  label: string;
  iconP: string;
  iconB: string;
}

interface DropdownConfig {
  type: 'dropdown';
  label: string;
  iconP: string;
  iconB: string;
  items: { href: string; label: string }[];
}

export type SidebarConfig = (NavItemConfig | DropdownConfig)[];

interface SidebarBaseProps {
  items: SidebarConfig;
}

export default function SidebarBase({ items }: SidebarBaseProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const navIcon = (href: string, iconP: string, iconB: string) =>
    isActive(href) ? (
      <img src={iconB} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
    ) : (
      <>
        <img src={iconP} alt="" className="w-5 h-5 object-contain flex-shrink-0 group-hover:hidden" />
        <img src={iconB} alt="" className="w-5 h-5 object-contain flex-shrink-0 hidden group-hover:block" />
      </>
    );

  const navItem = (href: string, label: string, iconP: string, iconB: string) => (
    <Link
      key={href}
      href={href}
      className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive(href)
          ? 'bg-amana-white text-amana-blue shadow-sm'
          : 'text-amana-white/80 hover:bg-amana-white hover:text-amana-blue'
      }`}
    >
      {navIcon(href, iconP, iconB)}
      <span className={`font-medium text-sm ml-3 ${isActive(href) ? '' : 'group-hover:translate-x-0.5'} transition-transform duration-200`}>
        {label}
      </span>
      {isActive(href) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amana-blue animate-pulse-glow" />}
    </Link>
  );

  const dropdown = (
    label: string,
    iconP: string,
    iconB: string,
    items: { href: string; label: string }[],
  ) => {
    const anyActive = items.some((i) => isActive(i.href));
    return (
      <div key={label} className={`group rounded-xl transition-all duration-200 cursor-pointer ${anyActive ? 'bg-amana-white/5' : ''}`}>
        <div
          className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
            anyActive
              ? 'bg-amana-white text-amana-blue shadow-sm'
              : 'text-amana-white/80 hover:bg-amana-white hover:text-amana-blue'
          }`}
        >
          {anyActive ? (
            <img src={iconB} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
          ) : (
            <>
              <img src={iconP} alt="" className="w-5 h-5 object-contain flex-shrink-0 group-hover:hidden" />
              <img src={iconB} alt="" className="w-5 h-5 object-contain flex-shrink-0 hidden group-hover:block" />
            </>
          )}
          <span className="font-medium text-sm ml-3">{label}</span>
          {anyActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amana-blue animate-pulse-glow" />}
        </div>
        <div className={`grid transition-all duration-300 ease-in-out ${
          anyActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100'
        }`}>
          <div className="overflow-hidden">
            <div className="relative ml-5 pl-4 border-l border-amana-white/20 my-1.5 space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-amana-white text-amana-blue shadow-sm'
                      : 'text-amana-white/80 hover:bg-amana-white hover:text-amana-blue'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen sticky top-0 bg-amana-blue text-amana-white flex flex-col font-sans w-64 shadow-2xl flex-shrink-0 z-50 p-3">
      <div className="pt-4 pb-4 flex flex-col items-center justify-center text-center w-full">
        <div className="flex flex-col items-center w-fit">
          <h1 className="font-normal tracking-wide mb-1 text-amana-white text-4xl">AMANA</h1>
          <p className="font-semibold italic text-[10px] uppercase tracking-[0.2em] text-amana-sec-2 mb-3">
            Core Administrative System
          </p>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-amana-white/60 to-transparent" />
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) =>
          item.type === 'item' ? (
            navItem(item.href, item.label, item.iconP, item.iconB)
          ) : (
            dropdown(item.label, item.iconP, item.iconB, item.items)
          )
        )}
      </nav>
    </div>
  );
}
