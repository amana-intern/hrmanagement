import { cn } from '@/app/utils/cn';

/** Figma node 1044:7204 (LOADING2) — the designer's exact gradient-ring asset, spun via CSS. */
export default function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/loading-spinner.svg"
      alt=""
      role="status"
      aria-label="Loading"
      className={cn('inline-block animate-spin', className)}
    />
  );
}
