'use client';

import SidebarPar from '../../components/navigation/SidebarPartner/Sidebarpartner';
import { ProfilePageShell } from '../../components/layout';

export default function SuperadminProfilePage() {
  return (
    <ProfilePageShell
      sidebar={<SidebarPar />}
      greeting="Hello, Partner!"
      title="Partner"
      subtitle="Executive Leadership"
      footer="Pending Approvals: 5"
      stats={[
        { value: 3, label: 'Leave Approval' },
        { value: 2, label: 'Contract Renewal' },
        { value: 2, label: 'Payment Approval', color: 'text-amana-sec-5' },
        { value: 12, label: 'Total Employees', color: 'text-amana-sec-8' },
      ]}
    />
  );
}
