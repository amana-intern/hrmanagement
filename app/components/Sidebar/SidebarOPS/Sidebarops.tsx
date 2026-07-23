'use client';

import SidebarBase from '../SidebarBase';
import type { SidebarConfig } from '../SidebarBase';

const items: SidebarConfig = [
  { type: 'item', href: '/ops/profile', label: 'Profile', iconP: '/icon/PProfile.png', iconB: '/icon/BProfile.png' },
  { type: 'item', href: '/ops/paymentapproval', label: 'Payment Approval', iconP: '/icon/PPayment.png', iconB: '/icon/BPayment.png' },
];

export default function SidebarOPS() {
  return <SidebarBase items={items} />;
}
