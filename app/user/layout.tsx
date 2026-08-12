import PageLayout from '../components/layout/PageLayout';
import RoleSidebar from '../components/Sidebar/RoleSidebar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout sidebar={<RoleSidebar />}>{children}</PageLayout>;
}