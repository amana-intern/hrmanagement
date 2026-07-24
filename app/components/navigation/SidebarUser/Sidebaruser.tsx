'use client';

import SidebarBase from '../SidebarBase';
import type { SidebarConfig } from '../SidebarBase';

const items: SidebarConfig = [
  { type: 'item', href: '/user/profile', label: 'Profile', iconP: '/icon/PProfile.png', iconB: '/icon/BProfile.png' },
  {
    type: 'dropdown',
    label: 'Attendance',
    iconP: '/icon/PAttendance.png',
    iconB: '/icon/BAttendance.png',
    items: [
      { href: '/user/attendance/leaverequest', label: 'Leave Request' },
      { href: '/user/attendance/sickleave', label: 'Sick Leave' },
    ],
  },
  { type: 'item', href: '/user/payment', label: 'Payment', iconP: '/icon/PPayment.png', iconB: '/icon/BPayment.png' },
  { type: 'item', href: '/user/careerhub', label: 'Career Hub', iconP: '/icon/PCarrerHub.png', iconB: '/icon/BCarrerHub.png' },
];

export default function SidebarUser() {
  return <SidebarBase items={items} />;
}
