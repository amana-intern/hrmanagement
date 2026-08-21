import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/roles';
import PageLayout from '@/app/components/layout/PageLayout';
import SidebarHR, { groups as hrGroups } from '@/app/components/Sidebar/SidebarHR/Sidebarhr';
import SidebarOPS, { groups as opsGroups } from '@/app/components/Sidebar/SidebarOPS/Sidebarops';
import SidebarPartner, { groups as partnerGroups } from '@/app/components/Sidebar/SidebarPartner/Sidebarpartner';
import SidebarUser, { groups as userGroups } from '@/app/components/Sidebar/SidebarUser/Sidebaruser';

// One shared layout for /hr, /ops, /partner, /user so the sidebar is resolved once
// server-side (from the session cookie) and never remounts when navigating between
// those sections — that remount (and the entrance-animation replay it triggered) was
// the source of the sidebar "blink" when e.g. an HR admin moved between /hr/* and /user/*.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const { sidebar, groups } =
    session?.idRole === ROLES.ADMIN_HR
      ? { sidebar: <SidebarHR />, groups: hrGroups }
      : session?.idRole === ROLES.ADMIN_OPS
        ? { sidebar: <SidebarOPS />, groups: opsGroups }
        : session?.idRole === ROLES.PARTNER
          ? { sidebar: <SidebarPartner />, groups: partnerGroups }
          : { sidebar: <SidebarUser />, groups: userGroups };

  return (
    <PageLayout sidebar={sidebar} groups={groups}>
      {children}
    </PageLayout>
  );
}
