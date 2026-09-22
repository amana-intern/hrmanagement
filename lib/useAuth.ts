'use client';

import { useEffect, useState } from 'react';

export type SessionUser = {
  idUser: string;
  idRole: string;
  roleLabel: string | null;
  email: string;
  nama: string;
  grade: string | null;
  department: string | null;
};

export type AuthState = {
  loading: boolean;
  authenticated: boolean;
  user: SessionUser | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.authenticated) {
          setState({ loading: false, authenticated: true, user: data.user });
        } else {
          setState({ loading: false, authenticated: false, user: null });
        }
      } catch {
        if (active) setState({ loading: false, authenticated: false, user: null });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}