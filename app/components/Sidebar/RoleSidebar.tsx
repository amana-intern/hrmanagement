'use client';

import { useEffect, useState, type ReactElement } from 'react';
import SidebarHR from './SidebarHR/Sidebarhr';
import SidebarOPS from './SidebarOPS/Sidebarops';
import SidebarUser from './SidebarUser/Sidebaruser';

export default function RoleSidebar() {
  const [sidebar, setSidebar] = useState<ReactElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const role = data?.user?.idRole;
          if (role === 'ROLE_ADMIN_HR') setSidebar(<SidebarHR />);
          else if (role === 'ROLE_ADMIN_OPS') setSidebar(<SidebarOPS />);
          else setSidebar(<SidebarUser />);
        } else {
          setSidebar(<SidebarUser />);
        }
      } catch {
        setSidebar(<SidebarUser />);
      }
    })();
  }, []);

  if (!sidebar) {
    return <div className="h-screen w-64 flex-shrink-0 bg-amana-primary-500" />;
  }

  return <>{sidebar}</>;
}