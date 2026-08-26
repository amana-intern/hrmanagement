'use client';

import { useEffect, useState } from 'react';
import ProfileOverview, {
  type Stat,
  type SummaryPanelConfig,
  type ProfileBio,
} from '@/app/components/data-display/ProfileOverview';
import { useProfileMe } from '@/lib/useProfileMe';

interface DashboardData {
  attendance: {
    pendingApproval: number;
    sickLeave: number;
    totalLeave: number;
    updates: { text: string }[];
  };
  career: {
    pendingApproval: number;
    certificates: number;
    assessment: number;
    updates: { text: string }[];
  };
}

interface Me {
  nama: string;
  email: string;
  noTelepon: string | null;
  rolesDivisi: string;
  roleLabel: string;
}

export default function HRProfilePage() {
  const { me, loading, todos, addTodo, toggleTodo, deleteTodo } = useProfileMe<Me>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hr/dashboard', { cache: 'no-store' });
        if (res.ok) setData((await res.json()) as DashboardData);
      } catch {}
      setLoadingDashboard(false);
    })();
  }, []);

  const stat = (value: number, label: string, caption: string): Stat => ({ value, label, caption });

  const attendancePanel: SummaryPanelConfig = {
    title: 'Attendance Summary',
    stats: [
      stat(data?.attendance.pendingApproval ?? 0, 'Pending Approval', 'Awaiting approval'),
      stat(data?.attendance.sickLeave ?? 0, 'Sick Leave', 'Sick leave recorded'),
      stat(data?.attendance.totalLeave ?? 0, 'Total Leave', 'Total leave requests'),
    ],
    updates: (data?.attendance.updates ?? []).map((u) => u.text),
  };

  const careerPanel: SummaryPanelConfig = {
    title: 'Career Hub Summary',
    stats: [
      stat(data?.career.pendingApproval ?? 0, 'Assessment Pending', 'Not yet completed assessment'),
      stat(data?.career.certificates ?? 0, 'Certificates', 'Total certificates'),
      stat(data?.career.assessment ?? 0, 'Assessment', 'Completed'),
    ],
    updates: (data?.career.updates ?? []).map((u) => u.text),
  };

  const bio: ProfileBio = {
    name: me?.nama ?? 'Amana User',
    role: me?.rolesDivisi ?? me?.roleLabel ?? 'Human Resource',
    email: me?.email ?? '-',
    phone: me?.noTelepon ?? '-',
  };

  return (
    <ProfileOverview
      showGreeting
      showLogout
      showCareerHistory
      loading={loading || loadingDashboard}
      panels={[attendancePanel, careerPanel]}
      bio={bio}
      todos={todos}
      onAddTodo={addTodo}
      onToggleTodo={toggleTodo}
      onDeleteTodo={deleteTodo}
      pageLabel="Profile"
    />
  );
}
