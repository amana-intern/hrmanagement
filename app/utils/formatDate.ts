'use client';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Format tanggal seragam "d MonthName yyyy" (zona WIB), mis. "18 August 2026".
export function formatDateWIB(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '-';
  // Convert to WIB (UTC+7) for day/month/year extraction
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const day = wib.getDate();
  const month = MONTH_NAMES[wib.getMonth()];
  const year = wib.getFullYear();
  return `${day} ${month} ${year}`;
}

// Format timestamp (UTC/ISO dari DB) menjadi tanggal + jam WIB,
// mis. "18 August 2026 on 10:00 WIB".
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
  return `${date} at ${time} WIB`;
}
