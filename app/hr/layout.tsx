import PageLayout from '../components/layout/PageLayout';
import SidebarHR from '../components/Sidebar/SidebarHR/Sidebarhr';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout sidebar={<SidebarHR />}>{children}</PageLayout>;
}
