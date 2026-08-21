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
  stats: {
    pendingLeaves: number;
    sickLeaves: number;
    pendingPayments: number;
    certificates: number;
  };
}

export default function OPSProfilePage() {
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

  const paymentPanel: SummaryPanelConfig = {
    title: 'Payment Operations',
    stats: [
      stat(me?.stats.pendingPayments ?? 0, 'Payment Pending', 'Payment request(s) awaiting your review'),
      stat(me?.stats.pendingLeaves ?? 0, 'Leave Pending', 'Leave request(s) awaiting approval'),
    ],
    updates: [
      `You have ${me?.stats.pendingPayments ?? 0} pending payment request(s) to review`,
      `You have ${me?.stats.pendingLeaves ?? 0} pending leave request(s) awaiting approval`,
    ],
  };

  const opsPanel: SummaryPanelConfig = {
    title: 'Operations Dashboard',
    stats: [
      stat(me?.stats.sickLeaves ?? 0, 'Sick Leave', 'Sick leave record(s) this year'),
      stat(me?.stats.certificates ?? 0, 'Certificates', 'Certificates uploaded by employees'),
    ],
    updates: [
      'Coordinate payment scheduling to keep fund flow on time',
      'Monitor pending approvals across the organization',
    ],
  };

  const bio: ProfileBio = {
    name: me?.nama ?? 'Amana OPS',
    role: me?.rolesDivisi ?? me?.roleLabel ?? 'Operation Department',
    email: me?.email ?? '-',
    phone: me?.noTelepon ?? '-',
  };

  return (
    <ProfileOverview
      showGreeting
      showLogout
      showCareerHistory
      panels={[paymentPanel, opsPanel]}
      bio={bio}
      todos={todos}
      onAddTodo={addTodo}
      onToggleTodo={toggleTodo}
      onDeleteTodo={deleteTodo}
      pageLabel="Profile"
    />
  );
}