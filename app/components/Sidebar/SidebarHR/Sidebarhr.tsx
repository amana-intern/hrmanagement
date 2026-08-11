'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

const groups: NavGroup[] = [
  { title: 'Account', links: [{ href: '/hr/profile', label: 'Profile' }] },
  {
    title: 'Attendance',
    links: [
      { href: '/hr/leaveapproval', label: 'Leave Record' },
      { href: '/hr/medicalleave', label: 'Medical Leave Record' },
    ],
  },
  {
    title: 'Career Hub',
    links: [
      { href: '/hr/contracttracking', label: 'Contract Tracking' },
      { href: '/hr/talentroster', label: 'Talent Roster' },
      { href: '/hr/joblistings', label: 'Job Listing' },
    ],
  },
];

export default function SidebarHR() {
  return <SidebarNavBase groups={groups} />;
}
