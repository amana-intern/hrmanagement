'use client';

import { useState, useCallback } from 'react';

export interface TodoItem {
  id: number | string;
  text: string;
  done: boolean;
}

interface TodoRaw {
  idTodo: string;
  teks: string | null;
  done: boolean;
}

/**
 * Hook to-do list generik untuk semua role. Data dipersist ke server
 * (/api/todos), done otomatis disortir ke bawah dan menghilang setelah 7 hari.
 */
export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const loadTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos', { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as { list: TodoRaw[] };
        setTodos((json.list ?? []).map((t) => ({ id: t.idTodo, text: t.teks ?? '', done: t.done })));
      }
    } catch {}
  }, []);

  const addTodo = useCallback(
    async (text: string) => {
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teks: text }),
        });
        if (res.ok) await loadTodos();
      } catch {}
    },
    [loadTodos]
  );

  const toggleTodo = useCallback(
    async (id: TodoItem['id']) => {
      const item = todos.find((t) => t.id === id);
      if (!item) return;
      try {
        const res = await fetch(`/api/todos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: !item.done }),
        });
        if (res.ok) await loadTodos();
      } catch {}
    },
    [todos, loadTodos]
  );

  const deleteTodo = useCallback(
    async (id: TodoItem['id']) => {
      try {
        const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        if (res.ok) await loadTodos();
      } catch {}
    },
    [loadTodos]
  );

  return { todos, loadTodos, addTodo, toggleTodo, deleteTodo };
}