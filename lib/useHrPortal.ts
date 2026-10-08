'use client';

import { useCallback, useEffect, useState } from 'react';

export interface HrPortalItem {
  idMading: string;
  judul: string | null;
  pesan: string | null;
  link: string | null;
  audience: 'ALL' | 'TARGETED';
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  isDone: boolean;
  doneAt: string | null;
  createdAt: string | null;
  isAuthor: boolean;
  isRecipient: boolean;
  isRead: boolean;
}

interface HrPortalResponse {
  canManage: boolean;
  unread: number;
  list: HrPortalItem[];
}

export interface HrPortalCreatePayload {
  judul: string;
  pesan: string;
  link?: string | null;
  audience: 'ALL' | 'TARGETED';
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  recipientIds?: string[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Hook feed HR Portal (pengganti useTodos). Fetch + useEffect tanpa SWR,
 * tanpa polling — refresh hanya setelah aksi (atau dipanggil manual via load()).
 */
export function useHrPortal() {
  const [list, setList] = useState<HrPortalItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/hrportal', { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as HrPortalResponse;
        setList(json.list ?? []);
        setUnread(json.unread ?? 0);
        setCanManage(!!json.canManage);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback(
    async (path: string, body: unknown): Promise<ActionResult> => {
      try {
        const res = await fetch(path, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) return { ok: true };
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: data?.error };
      } catch {
        return { ok: false, error: 'Something went wrong' };
      }
    },
    []
  );

  // Tandai read — optimis di lokal (badge unread ikut berkurang) tanpa reload penuh.
  // Bila server menolak (gagal persist) → load() ulang supaya tidak ada "read hantu".
  const markRead = useCallback(
    async (id: string) => {
      setList((prev) => prev.map((m) => (m.idMading === id ? { ...m, isRead: true } : m)));
      setUnread((n) => Math.max(0, n - 1));
      try {
        const res = await fetch(`/api/hrportal/${id}/state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read' }),
        });
        if (!res.ok) await load();
      } catch {
        await load();
      }
    },
    [load]
  );

  const dismiss = useCallback(
    async (id: string): Promise<ActionResult> => {
      const r = await patch(`/api/hrportal/${id}/state`, { action: 'dismiss' });
      if (r.ok) await load();
      return r;
    },
    [patch, load]
  );

  const toggleDone = useCallback(
    async (id: string, done: boolean): Promise<ActionResult> => {
      const r = await patch(`/api/hrportal/${id}/done`, { done });
      if (r.ok) await load();
      return r;
    },
    [patch, load]
  );

  const remove = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        const res = await fetch(`/api/hrportal/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await load();
          return { ok: true };
        }
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: data?.error };
      } catch {
        return { ok: false, error: 'Something went wrong' };
      }
    },
    [load]
  );

  // Arsip pribadi: post yang SAYA centang (isDone di MadingUserState). Terbuka untuk semua role.
  const loadArchive = useCallback(async (): Promise<HrPortalItem[]> => {
    try {
      const res = await fetch('/api/hrportal?archive=1', { cache: 'no-store' });
      if (!res.ok) return [];
      const json = (await res.json()) as HrPortalResponse;
      return json.list ?? [];
    } catch {
      return [];
    }
  }, []);

  const create = useCallback(
    async (payload: HrPortalCreatePayload): Promise<ActionResult> => {
      try {
        const res = await fetch('/api/hrportal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await load();
          return { ok: true };
        }
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: data?.error ?? 'Failed to publish announcement' };
      } catch {
        return { ok: false, error: 'Something went wrong' };
      }
    },
    [load]
  );

  // Edit announcement (Admin HR — semua akun, siapa pun pembuatnya) → PATCH /api/hrportal/[id].
  const update = useCallback(
    async (id: string, payload: HrPortalCreatePayload): Promise<ActionResult> => {
      try {
        const res = await fetch(`/api/hrportal/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await load();
          return { ok: true };
        }
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: data?.error ?? 'Failed to update announcement' };
      } catch {
        return { ok: false, error: 'Something went wrong' };
      }
    },
    [load]
  );

  return { list, unread, canManage, load, loadArchive, markRead, dismiss, toggleDone, remove, create, update };
}
