'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

const groups: NavGroup[] = [
  { title: 'Account', links: [{ href: '/ops/profile', label: 'Profile' }] },
  {
    title: 'Attendance',
    links: [
      { href: '/user/attendance/leaverequest', label: 'Leave Request' },
      { href: '/user/attendance/sickleave', label: 'Sick Leave' },
    ],
  },
  {
    title: 'Payment',
    links: [
      { href: '/user/payment', label: 'Payment Request' },
      { href: '/ops/paymentapproval', label: 'Payment Approval' },
      { href: '/ops/paymentscheduler', label: 'Payment Scheduler' },
    ],
  },
  {
    title: 'Career Hub',
    links: [{ href: '/user/careerhub', label: 'Career Hub' }],
  },
];

export default function SidebarOPS() {
  return <SidebarNavBase groups={groups} />;
}