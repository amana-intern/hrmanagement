'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

const groups: NavGroup[] = [
  { title: 'Account', links: [{ href: '/partner/profile', label: 'Profile' }] },
  {
    title: 'Employee Record',
    links: [{ href: '/partner/contracttracking', label: 'Contract Tracking' }],
  },
  {
    title: 'Approvals',
    links: [
      { href: '/partner/leaveapproval', label: 'Leave Approval' },
      { href: '/partner/paymentapproval', label: 'Payment Approval' },
    ],
  },
];

export default function SidebarPartner() {
  return <SidebarNavBase groups={groups} />;
}