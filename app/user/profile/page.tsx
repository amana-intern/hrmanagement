import ProfileOverview, { type Stat } from '../../components/data-display/ProfileOverview';

const attendanceStats: Stat[] = [
  { value: 1, label: 'Leave Pending', caption: 'Your leave request awaiting approval' },
  { value: 3, label: 'Leave Taken', caption: 'Day(s) of leave taken this year' },
  { value: 0, label: 'Sick Leave', caption: 'Sick leave record(s) this month' },
];

const attendanceUpdates = [
  'Your leave request #1024 is pending approval',
  'Leave request #1024 submitted for approval',
  'Sick leave record updated',
  'Leave request #0998 approved last month',
  'Attendance record synced today',
];

const careerHubStats: Stat[] = [
  { value: 1, label: 'Assessment Test', caption: 'Assessment test still needs to be completed' },
  { value: 1, label: 'Payment Approved', caption: 'Payment request approved this month' },
  { value: 1, label: 'CV Update', caption: 'CV not updated in 3 months' },
];

const careerHubUpdates = [
  'You still need to complete your assessment test',
  'Payment request #1023 has been approved',
  'Your CV has not been updated in 3 months',
  'Payment #1023 approved by Partner',
  'CV updated in Career Hub',
];

export default function UserProfilePage() {
  return (
    <ProfileOverview
      showGreeting
      panels={[
        { title: 'Attendance Summary', stats: attendanceStats, updates: attendanceUpdates },
        { title: 'Career Hub Summary', stats: careerHubStats, updates: careerHubUpdates },
      ]}
      bio={{
        name: 'Amana User',
        role: 'Senior Analyst - Consultant',
        email: 'user@amana.com',
        phone: '+62 812-3456-7890',
      }}
    />
  );
}
