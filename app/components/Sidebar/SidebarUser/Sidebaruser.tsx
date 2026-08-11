'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

const groups: NavGroup[] = [
  {
    title: 'Employee',
    links: [
      { href: '/user/profile', label: 'Profile' },
      { href: '/user/careerhub', label: 'Career Hub' },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/user/leaverequest', label: 'Request Leave' },
      { href: '/user/sickleave', label: 'Request Sick Leave' },
      { href: '/user/payment', label: 'Request Payment' },
    ],
  },
];

export default function SidebarUser() {
  return <SidebarNavBase groups={groups} />;
}
