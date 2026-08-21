'use client';

import { useEffect, useState } from 'react';
import ProfileOverview, { type Stat, type SummaryPanelConfig, type ProfileBio } from '@/app/components/data-display/ProfileOverview';
import { useTodos } from '@/lib/useTodos';

interface Me {
  nama: string;
  email: string;
  noTelepon: string | null;
  rolesDivisi: string;
  roleLabel: string;
  displayGrade: string | null;
  leave: {
    sisaCuti: number | null;
    accrued: number | null;
    carryOver: number | null;
    specialLeaveUsed: number;
    unpaidLeaveUsed: number;
  };
  stats: {
    pendingLeaves: number;
    sickLeaves: number;
    pendingPayments: number;
    certificates: number;
  };
}

export default function UserProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const { todos, loadTodos, addTodo, toggleTodo, deleteTodo } = useTodos();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.ok) setMe(((await res.json()).user ?? null) as Me | null);
      } catch {}
      await loadTodos();
    })();
  }, [loadTodos]);

  const stat = (value: number | string, label: string, caption: string): Stat => ({ value, label, caption });

  const attendancePanel: SummaryPanelConfig = {
    title: 'Attendance Summary',
    stats: [
      stat(me?.leave.sisaCuti ?? 0, 'Leave Balance', `Paid Leave balance(s)`),
      stat(me?.stats.pendingLeaves ?? 0, 'Leave Pending', 'Your leave request awaiting approval'),
      stat(me?.stats.sickLeaves ?? 0, 'Sick Leave', 'Sick leave record(s) this year'),
    ],
    updates: [
      `Your leave balance is ${me?.leave.sisaCuti ?? 0} day(s)`,
      `You have ${me?.stats.pendingLeaves ?? 0} pending leave request(s)`,
      `You have ${me?.stats.sickLeaves ?? 0} sick leave record(s)`,
    ],
  };

  const careerPanel: SummaryPanelConfig = {
    title: 'Career Hub Summary',
    stats: [
      stat(me?.stats.certificates ?? 0, 'Certificates', 'Certificates you have uploaded'),
      stat(me?.stats.pendingPayments ?? 0, 'Payment Pending', 'Payment request(s) awaiting approval'),
      stat(me?.leave.sisaCuti ?? 0, 'Paid Leave', 'Remaining paid leave balance(s)'),
    ],
    updates: [
      `You have uploaded ${me?.stats.certificates ?? 0} certificate(s)`,
      `You have ${me?.stats.pendingPayments ?? 0} pending payment request(s)`,
      `Your CV is ready to be updated in Career Hub`,
    ],
  };

  const bio: ProfileBio = {
    name: me?.nama ?? 'Amana User',
    role: me?.rolesDivisi ?? me?.roleLabel ?? 'Amana Employee',
    email: me?.email ?? '-',
    phone: me?.noTelepon ?? '-',
  };

  return (
    <ProfileOverview
      showGreeting
      showLogout
      showCareerHistory
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
