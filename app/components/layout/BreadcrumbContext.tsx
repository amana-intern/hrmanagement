'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { NavGroup } from '../Sidebar/SidebarNavBase';
import { resolveBreadcrumb } from '@/app/utils/breadcrumb';

const BreadcrumbContext = createContext<NavGroup[]>([]);

export function BreadcrumbProvider({ groups, children }: { groups: NavGroup[]; children: ReactNode }) {
  return <BreadcrumbContext.Provider value={groups}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumb(): { section: string; page: string } | null {
  const groups = useContext(BreadcrumbContext);
  const pathname = usePathname();
  return resolveBreadcrumb(pathname, groups);
}
