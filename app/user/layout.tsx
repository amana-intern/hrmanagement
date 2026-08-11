import PageLayout from '../components/layout/PageLayout';
import SidebarUser from '../components/Sidebar/SidebarUser/Sidebaruser';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout sidebar={<SidebarUser />}>{children}</PageLayout>;
}
