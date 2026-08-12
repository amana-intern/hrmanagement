'use client';

import { useEffect, useState } from 'react';
import ProfileOverview, {
  type Stat,
  type SummaryPanelConfig,
  type ProfileBio,
} from '../../components/data-display/ProfileOverview';
import { useTodos } from '@/lib/useTodos';

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
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const { todos, loadTodos, addTodo, toggleTodo, deleteTodo } = useTodos();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.ok) setMe(((await res.json()).user ?? null) as Me | null);
      } catch {}
      try {
        const res = await fetch('/api/hr/dashboard', { cache: 'no-store' });
        if (res.ok) setData((await res.json()) as DashboardData);
      } catch {}
      await loadTodos();
    })();
  }, [loadTodos]);

  const stat = (value: number, label: string, caption: string): Stat => ({ value, label, caption });

  const attendancePanel: SummaryPanelConfig = {
    title: 'Attendance Summary',
    stats: [
      stat(data?.attendance.pendingApproval ?? 0, 'Pending Approval', 'Menunggu persetujuan'),
      stat(data?.attendance.sickLeave ?? 0, 'Sick Leave', 'Izin sakit tercatat'),
      stat(data?.attendance.totalLeave ?? 0, 'Total Leave', 'Total pengajuan cuti'),
    ],
    updates: (data?.attendance.updates ?? []).map((u) => u.text),
  };

  const careerPanel: SummaryPanelConfig = {
    title: 'Career Hub Summary',
    stats: [
      stat(data?.career.pendingApproval ?? 0, 'Assessment Pending', 'Belum mengisi assessment'),
      stat(data?.career.certificates ?? 0, 'Certificates', 'Total sertifikat'),
      stat(data?.career.assessment ?? 0, 'Assessment', 'Sudah mengisi'),
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