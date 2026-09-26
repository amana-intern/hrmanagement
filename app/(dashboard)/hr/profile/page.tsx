'use client';

import { useEffect, useState } from 'react';
import ProfileOverview, {
  type Stat,
  type SummaryPanelConfig,
  type ProfileBio,
  type ProfileBioDetails,
} from '@/app/components/data-display/ProfileOverview';
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
    assessmentTotal: number;
    updates: { text: string }[];
  };
}

interface Me {
  nama: string;
  email: string;
  noTelepon: string | null;
  departmentLabel?: string | null;
  pictureUrl?: string | null;
  rolesDivisi: string;
  displayGrade?: string | null;
  roleLabel: string;
  tipeKontrak?: string | null;
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

  // Warna card "Assessment": % karyawan eligible yang sudah isi assessment.
  // <=50% merah (danger), 51-75% kuning (warning), >75% hijau (success).
  const assessed = data?.career.assessment ?? 0;
  const assessmentTotal = data?.career.assessmentTotal ?? 0;
  const assessmentPct = assessmentTotal > 0 ? Math.round((assessed / assessmentTotal) * 100) : 0;
  const assessmentTone = assessmentPct <= 50 ? 'danger' : assessmentPct <= 75 ? 'warning' : 'success';

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
      stat(data?.career.pendingApproval ?? 0, 'Assessment Pending', 'Not yet assessed'),
      stat(data?.career.certificates ?? 0, 'Certificates', 'Total certificates'),
      { ...stat(data?.career.assessment ?? 0, 'Assessment', 'Completed'), tone: assessmentTone },
    ],
    updates: (data?.career.updates ?? []).map((u) => u.text),
  };

  const bio: ProfileBio = {
    name: me?.nama ?? 'Amana User',
    role: [me?.departmentLabel, me?.displayGrade].filter(Boolean).join(' - ') || '-',
    email: me?.email ?? '-',
    phone: me?.noTelepon ?? '-',
    photoSrc: me?.pictureUrl ?? undefined,
  };

  const bioDetails: ProfileBioDetails = {
    grade: me?.displayGrade || '-',
    department: me?.departmentLabel || '-',
    position: me?.roleLabel || '-',
    contractType: me?.tipeKontrak || '-',
  };

  return (
    <ProfileOverview
      showGreeting
      showCareerHistory
      panels={[attendancePanel, careerPanel]}
      bio={bio}
      bioDetails={bioDetails}
      todos={todos}
      onAddTodo={addTodo}
      onToggleTodo={toggleTodo}
      onDeleteTodo={deleteTodo}    />
  );
}