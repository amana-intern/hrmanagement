'use client';

import { useEffect } from 'react';

/**
 * Mencegah isian input angka (type="number") berubah saat user tidak sengaja
 * scroll (touchpad/mouse wheel) ketika kursor masih berada di atas field.
 * Cursor juga di-blur sehingga scroll berikutnya kembali menggulir halaman.
 */
export default function NumberInputGuard() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches?.('input[type="number"]') && target === document.activeElement) {
        e.preventDefault();
        target.blur();
      }
    };

    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);

  return null;
}