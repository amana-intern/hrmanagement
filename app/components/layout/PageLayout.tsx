'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSmoothWheelScroll } from '@/app/utils/useSmoothWheelScroll';
import { fadeUp } from '@/app/utils/motion';
import { BreadcrumbProvider } from './BreadcrumbContext';
import type { NavGroup } from '../Sidebar/SidebarNavBase';

export default function PageLayout({
  sidebar,
  groups,
  children,
}: {
  sidebar: ReactNode;
  groups: NavGroup[];
  children: ReactNode;
}) {
  const scrollRef = useSmoothWheelScroll<HTMLElement>();

  return (
    <BreadcrumbProvider groups={groups}>
      <div className="flex w-full h-screen overflow-hidden bg-amana-neutral-200 font-sans selection:bg-amana-primary-500 selection:text-white">
        {sidebar}
        <main ref={scrollRef} className="flex-1 p-2 md:p-3 lg:p-4 overflow-y-auto scroll-smooth bg-amana-neutral-200">
          <motion.div
            className="w-full h-full space-y-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </BreadcrumbProvider>
  );
}
