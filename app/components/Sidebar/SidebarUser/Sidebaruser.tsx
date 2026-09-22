'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

export const groups: NavGroup[] = [
  {
    title: 'Account',
    links: [
      { href: '/user/profile', label: 'Profile' },
      { href: '/user/careerhub', label: 'Career Hub', activePaths: ['/user/assessment', '/user/careerhub/result'] },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/user/attendance/leaverequest', label: 'Leave Request' },
      { href: '/user/attendance/sickleave', label: 'Sick Request' },
      { href: '/user/payment', label: 'Payment Request' },
    ],
  },
];

export default function SidebarUser() {
  return <SidebarNavBase groups={groups} />;
}
