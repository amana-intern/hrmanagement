'use client';

// Format tanggal WIB yang mudah dibaca (tanpa jam), mis. "18 August 2026".
export function formatDateWIB(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Format timestamp (UTC/ISO dari DB) menjadi tanggal + jam WIB yang mudah dibaca,
// mis. "4 August 2026, 10:00 am".
export function formatDateTimeWIB(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '-';
  const date = d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = d
    .toLocaleTimeString('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();
  return `${date}, ${time}`;
}