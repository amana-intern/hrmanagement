'use client';

import SidebarBase from '../SidebarBase';
import type { SidebarConfig } from '../SidebarBase';

const items: SidebarConfig = [
  { type: 'item', href: '/hr/profile', label: 'Profile', iconP: '/icon/PProfile.png', iconB: '/icon/BProfile.png' },
  {
    type: 'dropdown',
    label: 'Attendance',
    iconP: '/icon/PAttendance.png',
    iconB: '/icon/BAttendance.png',
    items: [
      { href: '/hr/leaveapproval', label: 'Leave Approval' },
      { href: '/hr/medicalleave', label: 'Medical Leave Record' },
    ],
  },
  {
    type: 'dropdown',
    label: 'Career Hub',
    iconP: '/icon/PCarrerHub.png',
    iconB: '/icon/BCarrerHub.png',
    items: [
      { href: '/hr/contracttracking', label: 'Contract Tracking' },
      { href: '/hr/talentroster', label: 'Talent Roster' },
      { href: '/hr/joblistings', label: 'Job Listings' },
    ],
  },
];

export default function SidebarHR() {
  return <SidebarBase items={items} />;
}
