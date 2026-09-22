'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * FLIP animation hook untuk daftar yang berubah urutan.
 * Setiap baris wajib diberi data-flip-id unik. Saat urutan/set berubah,
 * baris yang masih ada di-animasi pindah ke posisi baru (translateY) 250ms.
 */
export function useFlipLayout<T>(items: readonly T[] | T[]) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rows = el.querySelectorAll<HTMLElement>('[data-flip-id]');
    const seen = new Set<string>();
    rows.forEach((row) => {
      const id = row.dataset.flipId;
      if (!id) return;
      seen.add(id);
      const prevTop = prev.current.get(id);
      const newTop = row.offsetTop;
      if (prevTop !== undefined && prevTop !== newTop) {
        const delta = prevTop - newTop;
        row.style.transition = 'none';
        row.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          row.style.transition = 'transform 250ms ease';
          row.style.transform = '';
        });
      }
      prev.current.set(id, newTop);
    });
    // Bersihkan baris yang sudah tidak ada
    prev.current.forEach((_, id) => {
      if (!seen.has(id)) prev.current.delete(id);
    });
  }, [items]);

  return ref;
}