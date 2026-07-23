'use client';

import SidebarBase from '../SidebarBase';
import type { SidebarConfig } from '../SidebarBase';

const items: SidebarConfig = [
  { type: 'item', href: '/partner/profile', label: 'Profile', iconP: '/icon/PProfile.png', iconB: '/icon/BProfile.png' },
  { type: 'item', href: '/partner/leaveapproval', label: 'Leave Approval', iconP: '/icon/PAttendance.png', iconB: '/icon/BAttendance.png' },
  { type: 'item', href: '/partner/contracttracking', label: 'Contract Tracking', iconP: '/icon/PCarrerHub.png', iconB: '/icon/BCarrerHub.png' },
  { type: 'item', href: '/partner/paymentapproval', label: 'Payment Approval', iconP: '/icon/PPayment.png', iconB: '/icon/BPayment.png' },
];

export default function SidebarPar() {
  return <SidebarBase items={items} />;
}
