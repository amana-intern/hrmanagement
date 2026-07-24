'use client';

import SidebarHR from '../../components/navigation/SidebarHR/Sidebarhr';
import { ProfilePageShell } from '../../components/layout';

export default function HRProfilePage() {
  return (
    <ProfilePageShell
      sidebar={<SidebarHR />}
      greeting="Hello, HR Admin!"
      title="HR Department"
      subtitle="Human Resources"
      footer="Total Active Employees: 24"
      stats={[
        { value: 5, label: 'Leave Requests' },
        { value: 3, label: 'Sick Leave' },
        { value: 4, label: 'Expiring Contracts' },
        { value: 6, label: 'Active Jobs' },
      ]}
    />
  );
}
