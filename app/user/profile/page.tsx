'use client';

import SidebarUser from '../../components/navigation/SidebarUser/Sidebaruser';
import { ProfilePageShell } from '../../components/layout';

export default function ProfileUserPage() {
  return (
    <ProfilePageShell
      sidebar={<SidebarUser />}
      greeting="Hello, User!"
      title="User"
      subtitle="Employee"
      footer="Welcome to AMANA Internal System"
      stats={[
        { value: 2, label: 'Pending Leave', color: 'text-amana-sec-5' },
        { value: 1, label: 'Sick Leave' },
        { value: 0, label: 'Pending Payment' },
        { value: 3, label: 'Certificates', color: 'text-amana-sec-8' },
      ]}
    />
  );
}
