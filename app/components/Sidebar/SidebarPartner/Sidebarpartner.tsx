'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

export const groups: NavGroup[] = [
  {
    title: 'Account',
    links: [
      { href: '/partner/profile', label: 'Profile' },
      { href: '/user/careerhub', label: 'Career Hub', activePaths: ['/user/assessment', '/user/careerhub/result'] },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/user/attendance/leaverequest', label: 'Leave Request' },
      { href: '/user/attendance/sickleave', label: 'Sick Leave' },
    ],
  },
  {
    title: 'Partner Center',
    links: [
      { href: '/partner/leaveapproval', label: 'Leave Approval' },
      { href: '/partner/paymentapproval', label: 'Payment Approval' },
      { href: '/partner/contracttracking', label: 'Contract Management' },
    ],
  },
];

export default function SidebarPartner() {
  return <SidebarNavBase groups={groups} />;
}
