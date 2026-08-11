import ProfileOverview, { type Stat } from '../../components/data-display/ProfileOverview';

const attendanceStats: Stat[] = [
  { value: 5, label: 'Pending Approval', caption: 'Leave(s) currently waiting Partner Approval' },
  { value: 5, label: 'Employee(s) on Leave', caption: 'All Employee(s) currently on leave' },
  { value: 5, label: 'Suspicious sick leave', caption: 'Flagged for review' },
];

const attendanceUpdates = [
  'Rian Pratama submitted a leave request for 12–14 Aug',
  'Sick leave from Dewi Anjani flagged as suspicious',
  'Partner approved leave request from Fajar Nugroho',
  'Andi Saputra checked in late today at 09.15 AM',
  'Medical leave record updated for Siti Marlina',
];

const careerHubStats: Stat[] = [
  { value: 5, label: 'Pending Approval', caption: 'Leave(s) currently waiting Partner Approval' },
  { value: 5, label: 'Pending Approval', caption: 'Leave(s) currently waiting Partner Approval' },
  { value: 5, label: 'Pending Approval', caption: 'Leave(s) currently waiting Partner Approval' },
];

const careerHubUpdates = [
  'Contract for Budi Hartono expires in 15 days',
  'New job listing "Backend Engineer" published',
  'Talent Roster updated with 2 new candidates',
  '5 applicants received for "UI/UX Designer" listing',
  'Contract renewal pending approval for Reza Firmansyah',
];

export default function HRProfilePage() {
  return (
    <ProfileOverview
      showGreeting
      panels={[
        { title: 'Attendance Summary', stats: attendanceStats, updates: attendanceUpdates },
        { title: 'Career Hub Summary', stats: careerHubStats, updates: careerHubUpdates },
      ]}
      bio={{
        name: 'Amana User',
        role: 'Officer - Human Resource',
        email: 'hr@amana.com',
        phone: '+62 812-3456-7890',
      }}
    />
  );
}
