'use client';

import { useEffect, useState } from 'react';
import { useTodos } from './useTodos';

/**
 * Shared "load my profile + my todos" state for the 4 role profile pages
 * (hr/ops/partner/user) — each page supplies its own `Me` shape (fields differ
 * per role) but the fetch/loading/todos boilerplate is identical.
 */
export function useProfileMe<Me>() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const { todos, loadTodos, addTodo, toggleTodo, deleteTodo } = useTodos();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.ok) setMe(((await res.json()).user ?? null) as Me | null);
      } catch {}
      await loadTodos();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { me, loading, todos, addTodo, toggleTodo, deleteTodo };
}
