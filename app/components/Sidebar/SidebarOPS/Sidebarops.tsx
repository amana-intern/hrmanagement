'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

export const groups: NavGroup[] = [
  {
    title: 'Account',
    links: [
      { href: '/ops/profile', label: 'Profile' },
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
  {
    title: 'OPS Center',
    links: [
      { href: '/ops/paymentapproval', label: 'Payment Approval' },
      { href: '/ops/paymentscheduler', label: 'Payment Scheduler' },
    ],
  },
];

export default function SidebarOPS() {
  return <SidebarNavBase groups={groups} />;
}
