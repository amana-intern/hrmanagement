/**
 * Maps a status label to a StatusPill color class for the common Approved/Rejected/Pending
 * pattern (used identically by hr+partner leave approval and partner payment approval).
 * Pages with page-specific status semantics (e.g. ops payment request/scheduler, where
 * "Waiting ..." states intentionally use different colors per page) keep their own map.
 */
export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('reject')) return 'bg-amana-danger-500';
  if (s.includes('approve')) return 'bg-amana-success-500';
  if (s.includes('pending')) return 'bg-amana-warning-500';
  return 'bg-amana-neutral-400';
}
