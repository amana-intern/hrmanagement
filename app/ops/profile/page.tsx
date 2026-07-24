'use client';

import SidebarOPS from '../../components/navigation/SidebarOPS/Sidebarops';
import { ProfilePageShell } from '../../components/layout';

export default function OPSProfilePage() {
  return (
    <ProfilePageShell
      sidebar={<SidebarOPS />}
      greeting="Hello, OPS Admin!"
      title="Operations Department"
      subtitle="Operations"
      footer="Total Payment Requests: 5"
      stats={[
        { value: 5, label: 'Total Requests' },
        { value: 3, label: 'Pending Review', color: 'text-amana-sec-5' },
        { value: 1, label: 'Approved', color: 'text-amana-sec-8' },
        { value: 1, label: 'Rejected', color: 'text-amana-sec-5' },
      ]}
    />
  );
}
