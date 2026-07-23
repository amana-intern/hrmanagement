'use client';

import SidebarUser from '../../components/Sidebar/SidebarUser/Sidebaruser';
import { PageLayout, PageTitle, ProfileCard, StatCard } from '../../components/ui';

export default function ProfileUserPage() {
  return (
    <PageLayout sidebar={<SidebarUser />}>
      <PageTitle>Profile</PageTitle>
      <ProfileCard
        greeting="Hello, User!"
        title="User"
        subtitle="Employee"
        footer="Welcome to AMANA Internal System"
      >
        <h3 className="text-xl font-bold text-amana-black mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="animate-fade-in delay-100"><StatCard value={2} label="Pending Leave" color="text-yellow-600" /></div>
          <div className="animate-fade-in delay-200"><StatCard value={1} label="Sick Leave" /></div>
          <div className="animate-fade-in delay-300"><StatCard value={0} label="Pending Payment" /></div>
          <div className="animate-fade-in delay-400"><StatCard value={3} label="Certificates" color="text-green-600" /></div>
        </div>
      </ProfileCard>
    </PageLayout>
  );
}
