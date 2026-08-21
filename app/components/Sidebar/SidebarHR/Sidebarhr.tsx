'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

const groups: NavGroup[] = [
  { title: 'Account', links: [{ href: '/hr/profile', label: 'Profile' }] },
  {
    title: 'Attendance',
    links: [
      { href: '/hr/leaverecord', label: 'Leave Record' },
      { href: '/hr/medicalleave', label: 'Medical Leave Record' },
      { href: '/hr/blockeddates', label: 'Blocked Dates' },
      { href: '/user/attendance/leaverequest', label: 'Leave Request' },
      { href: '/user/attendance/sickleave', label: 'Sick Leave' },
    ],
  },
  {
    title: 'Payment',
    links: [{ href: '/user/payment', label: 'Payment Request' }],
  },
  {
    title: 'Career Hub',
    links: [
      { href: '/hr/contracttracking', label: 'Contract Tracking' },
      { href: '/hr/talentroster', label: 'Talent Management' },
      { href: '/hr/joblistings', label: 'Job Listings' },
      { href: '/user/careerhub', label: 'Career Hub' },
    ],
  },
];

export default function SidebarHR() {
  return <SidebarNavBase groups={groups} />;
}