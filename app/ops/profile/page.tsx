import ProfileOverview, { type Stat } from '../../components/data-display/ProfileOverview';

const paymentStats: Stat[] = [
  { value: 3, label: 'Pending Review', caption: 'Payment request(s) awaiting OPS review' },
  { value: 2, label: 'Approved Today', caption: 'Payment(s) approved by Partner today' },
  { value: 1, label: 'Rejected', caption: 'Payment request(s) rejected' },
];

const paymentUpdates = [
  '3 payment requests pending ops review',
  '2 payments approved by Partner today',
  '1 payment request was rejected',
  'Monthly payment report ready to export',
  'Payment #1024 approved by Partner',
];

const activityStats: Stat[] = [
  { value: 4, label: 'Payments Processed', caption: 'Total payment(s) processed this week' },
  { value: 1, label: 'Flagged', caption: 'Payment(s) flagged for review' },
  { value: 2, label: 'Scheduled', caption: 'Payment(s) marked as scheduled' },
];

const activityUpdates = [
  'Payment #1024 approved by Partner',
  'Payment #1023 marked as Scheduled',
  'Payment #1021 was rejected by Finance',
  'Payment #1019 flagged for review',
  'Monthly payment report generated',
];

export default function OPSProfilePage() {
  return (
    <ProfileOverview
      showGreeting
      panels={[
        { title: 'Payment Summary', stats: paymentStats, updates: paymentUpdates },
        { title: 'Recent Activity', stats: activityStats, updates: activityUpdates },
      ]}
      bio={{
        name: 'Amana User',
        role: 'Operations - Officer',
        email: 'ops@amana.com',
        phone: '+62 813-4567-8901',
      }}
    />
  );
}
