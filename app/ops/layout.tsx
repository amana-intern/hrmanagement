import PageLayout from '../components/layout/PageLayout';
import SidebarOPS from '../components/Sidebar/SidebarOPS/Sidebarops';

export default function OPSLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout sidebar={<SidebarOPS />}>{children}</PageLayout>;
}
