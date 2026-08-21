'use client';

import SidebarNavBase from '../SidebarNavBase';
import type { NavGroup } from '../SidebarNavBase';

export const groups: NavGroup[] = [
  {
    title: 'Account',
    links: [
      { href: '/hr/profile', label: 'Profile' },
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
    title: 'Employee Record',
    links: [
      { href: '/hr/medicalleave', label: 'Medical Leave Record' },
      { href: '/hr/leaverecord', label: 'Leave Record' },
    ],
  },
  {
    title: 'HR Center',
    links: [
      { href: '/hr/manageassessment', label: 'Assessment Editor' },
      { href: '/hr/blockeddates', label: 'Leave Blocker' },
      { href: '/hr/contracttracking', label: 'Contract Tracking' },
      { href: '/hr/talentroster', label: 'Talent Roster' },
      { href: '/hr/joblistings', label: 'Job Listing' },
    ],
  },
];

export default function SidebarHR() {
  return <SidebarNavBase groups={groups} />;
}
