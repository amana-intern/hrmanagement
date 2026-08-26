'use client';

import { useEffect, useState } from 'react';
import ProfileOverview, { type Stat, type SummaryPanelConfig, type ProfileBio } from '@/app/components/data-display/ProfileOverview';
import { useTodos } from '@/lib/useTodos';

interface Me {
  nama: string;
  email: string;
  noTelepon: string | null;
  departmentLabel?: string | null;
  pictureUrl?: string | null;
  rolesDivisi: string;
  displayGrade?: string | null;
  roleLabel: string;
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
    role: [me?.departmentLabel, me?.displayGrade].filter(Boolean).join(' - ') || '-',
    email: me?.email ?? '-',
    phone: me?.noTelepon ?? '-',
    photoSrc: me?.pictureUrl ?? undefined,
  };

  return (
    <ProfileOverview
      showGreeting
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
