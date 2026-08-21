'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

export const groups: NavGroup[] = [
  { title: 'Account', links: [{ href: '/partner/profile', label: 'Profile' }] },
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
