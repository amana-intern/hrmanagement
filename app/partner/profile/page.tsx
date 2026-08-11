import ProfileOverview, { type Stat } from '../../components/data-display/ProfileOverview';

const approvalStats: Stat[] = [
  { value: 4, label: 'Pending Approval', caption: 'Leave approval(s) waiting for your decision' },
  { value: 2, label: 'Payment Review', caption: 'Payment request(s) needing partner review' },
  { value: 1, label: 'Contract Renewal', caption: 'Contract renewal requiring your approval' },
];

const approvalUpdates = [
  '4 leave approvals waiting for your decision',
  '2 payment requests need partner review',
  '1 contract renewal requires your approval',
  'Your approval rate this month: 86%',
  'Leave request #204 approved',
];

const contractStats: Stat[] = [
  { value: 3, label: 'Active Contracts', caption: 'Contract(s) currently active' },
  { value: 1, label: 'Expiring Soon', caption: 'Contract(s) expiring within 30 days' },
  { value: 2, label: 'Reviewed', caption: 'Contract(s) reviewed this month' },
];

const contractUpdates = [
  'Payment #1024 reviewed and approved',
  'Contract renewal for Jane Smith pending',
  'Leave request #198 approved',
  'Contract for Budi Hartono expires in 15 days',
  'New job listing "Backend Engineer" published',
];

export default function PartnerProfilePage() {
  return (
    <ProfileOverview
      showGreeting
      panels={[
        { title: 'Approval Summary', stats: approvalStats, updates: approvalUpdates },
        { title: 'Contract Tracking Summary', stats: contractStats, updates: contractUpdates },
      ]}
      bio={{
        name: 'Amana User',
        role: 'Partner - Health',
        email: 'partner@amana.com',
        phone: '+62 815-6789-0123',
      }}
    />
  );
}
