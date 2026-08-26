'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

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
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Render message text; URL segments (https://...) become clickable links.
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

// NotificationBell — header notification bell (all roles). Polls /api/notifications every 30s.
export default function NotificationBell() {
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
      // ignore
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
        className="relative flex items-center justify-center w-5 h-5 text-amana-primary-500 hover:text-amana-primary-300 transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-amana-danger-500 text-white text-[10px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-amana-neutral-100 border border-amana-primary-500 rounded-[5px] shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amana-neutral-200 sticky top-0 bg-amana-neutral-100">
            <p className="text-sm font-bold text-amana-primary-500">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-amana-neutral-400 hover:text-amana-primary-500">
                Mark all as read
              </button>
            )}
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
                    onClick={() => !n.isRead && markRead(n.idNotif)}
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
