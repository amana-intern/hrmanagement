'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { ROLES } from '@/lib/roles';

type Notif = {
  idNotif: string;
  tipe: string;
  judul: string;
  pesan: string | null;
  idReferensi: string | null;
  isRead: boolean;
  createdAt: string | null;
};

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

// Render teks pesan; segmen URL (https://...) dijadikan link yang bisa diklik.
function renderMessage(text: string | null) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/\S+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-amana-primary-500 underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Map notification type (+ role penerima) ke halaman "yang harus dilakukan".
// notifInfo boleh null sebelum session termuat — klik hanya mark-read.
function getRedirectUrl(tipe: string, role: string | null | undefined): string | null {
  if (!role) return null;

  switch (tipe) {
    // Payment — tahap approval / tindak lanjut
    case 'PAY_INFO':
      return role === ROLES.ADMIN_OPS ? '/ops/paymentapproval' : null;
    case 'PAY_PENDING_PARTNER':
      return role === ROLES.PARTNER ? '/partner/paymentapproval' : null;
    case 'PAY_WAITING_SCHEDULE':
      return role === ROLES.ADMIN_OPS ? '/ops/paymentscheduler' : null;
    case 'PAY_APPROVED':
    case 'PAY_REVIEW_APPROVED':
    case 'PAY_SCHEDULED':
    case 'PAY_PAID':
    case 'PAY_REJECTED':
      return '/user/payment';

    // Leave
    case 'LEAVE_INFO':
      return role === ROLES.PARTNER ? '/partner/leaveapproval' : null;
    case 'LEAVE_APPROVED':
    case 'LEAVE_REJECTED':
      return '/user/attendance/leaverequest';

    // Contract — approver berikutnya bergantung role penerima
    case 'CONTRACT_REMINDER_30':
    case 'CONTRACT_REMINDER_60':
    case 'CONTRACT_REMINDER_90':
    case 'CONTRACT_RENEWAL':
    case 'CONTRACT_OFFBOARDING':
      if (role === ROLES.ADMIN_HR) return '/hr/contracttracking';
      if (role === ROLES.PARTNER) return '/partner/contracttracking';
      return '/user/profile';

    default:
      return null;
  }
}

// NotificationBell — lonceng notifikasi di header (semua role).
// Data dari /api/notifications, polling tiap 30 detik.
export default function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } catch {
      // abaikan
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (idNotif: string) => {
    await fetch(`/api/notifications/${idNotif}`, { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => (n.idNotif === idNotif ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAll = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative bg-amana-primary-500 text-white text-xs font-bold py-2 px-3 rounded-xl uppercase tracking-wider hover:opacity-80 transition-all"
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-amana-neutral-100 border border-amana-neutral-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amana-neutral-200 sticky top-0 bg-amana-neutral-100">
            <p className="text-sm font-bold text-amana-primary-500">Notifications</p>
            <button
              onClick={unread > 0 ? markAll : undefined}
              disabled={unread === 0}
              className={`text-xs font-medium transition-colors ${
                unread > 0
                  ? 'text-amana-neutral-500 hover:text-amana-primary-500 cursor-pointer'
                  : 'text-amana-neutral-300 cursor-not-allowed'
              }`}
            >
              Mark all as read
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-amana-neutral-400 p-4">Loading...</p>
          ) : notifs.length === 0 ? (
            <p className="text-sm text-amana-neutral-400 p-4">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-amana-neutral-200">
              {notifs.map((n) => (
                <li key={n.idNotif}>
                  <button
                    onClick={() => {
                      if (!n.isRead) markRead(n.idNotif);
                      const url = getRedirectUrl(n.tipe, user?.idRole);
                      if (url) {
                        setOpen(false);
                        router.push(url);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-amana-primary-200/10 ${
                      n.isRead ? 'opacity-70' : 'bg-amana-primary-200/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.isRead ? 'bg-transparent' : 'bg-amana-primary-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-amana-neutral-500">{n.judul}</p>
                        <p className="text-xs text-amana-neutral-400 mt-0.5 break-words">{renderMessage(n.pesan)}</p>
                        <p className="text-[10px] text-amana-neutral-400/70 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
