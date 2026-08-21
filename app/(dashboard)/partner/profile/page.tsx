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

export default function PartnerProfilePage() {
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

  const approvalPanel: SummaryPanelConfig = {
    title: 'Approval Operations',
    stats: [
      stat(me?.stats.pendingPayments ?? 0, 'Payment Pending', 'Payment request(s) awaiting your approval'),
      stat(me?.stats.pendingLeaves ?? 0, 'Leave Pending', 'Leave request(s) awaiting approval'),
    ],
    updates: [
      `You have ${me?.stats.pendingPayments ?? 0} pending payment request(s) to approve`,
      `You have ${me?.stats.pendingLeaves ?? 0} pending leave request(s)`,
    ],
  };

  const partnerPanel: SummaryPanelConfig = {
    title: 'Partner Summary',
    stats: [
      stat(me?.stats.sickLeaves ?? 0, 'Sick Leave', 'Sick leave record(s) in your pillar'),
      stat(me?.stats.certificates ?? 0, 'Certificates', 'Certificates uploaded by employees'),
    ],
    updates: [
      'Review payment requests in your pillar promptly',
      'Track contract renewal for your team via Contract Tracking',
    ],
  };

  const bio: ProfileBio = {
    name: me?.nama ?? 'Amana Partner',
    role: me?.rolesDivisi ?? me?.roleLabel ?? 'Partner',
    email: me?.email ?? '-',
    phone: me?.noTelepon ?? '-',
  };

  return (
    <ProfileOverview
      showGreeting
      showLogout
      panels={[approvalPanel, partnerPanel]}
      bio={bio}
      todos={todos}
      onAddTodo={addTodo}
      onToggleTodo={toggleTodo}
      onDeleteTodo={deleteTodo}
      pageLabel="Profile"
    />
  );
}