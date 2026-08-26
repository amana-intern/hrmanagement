'use client';

// Format tanggal seragam dd/mm/yyyy (zona WIB), mis. "18/08/2026".
export function formatDateWIB(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Format timestamp (UTC/ISO dari DB) menjadi tanggal + jam WIB,
// mis. "04/08/2026 10.00 WIB".
export function formatDateTimeWIB(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '-';
  const date = formatDateWIB(d);
  const time = d.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} on ${time} WIB`;
}
