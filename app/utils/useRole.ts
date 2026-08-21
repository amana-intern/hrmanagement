'use client';

import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/roles';

let mePromise: Promise<{ user?: { idRole?: string } } | null> | null = null;

function loadMe(): Promise<{ user?: { idRole?: string } } | null> {
  mePromise ??= fetch('/api/me', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return mePromise;
}

// Role pengguna yang sedang login (cache module-level agar hanya fetch sekali).
export function useRole(): string | null {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadMe().then((d) => {
      if (alive) setRole(d?.user?.idRole ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  return role;
}

export function isAdminRole(role: string | null): boolean {
  return role === ROLES.ADMIN_HR || role === ROLES.ADMIN_OPS;
}