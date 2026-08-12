import PageLayout from '../components/layout/PageLayout';
import SidebarPartner from '../components/Sidebar/SidebarPartner/Sidebarpartner';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout sidebar={<SidebarPartner />}>{children}</PageLayout>;
}
