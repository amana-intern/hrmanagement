'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

const groups: NavGroup[] = [
  { title: 'Employee', links: [{ href: '/ops/profile', label: 'Profile' }] },
  {
    title: 'Career Hub',
    links: [
      { href: '/ops/paymentrequest', label: 'Payment Request' },
      { href: '/ops/paymentscheduler', label: 'Payment Scheduler' },
    ],
  },
];

export default function SidebarOPS() {
  return <SidebarNavBase groups={groups} />;
}
