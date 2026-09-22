import { cn } from '@/app/utils/cn';

/** Shimmering placeholder bar — built on the existing `.animate-shimmer` utility in globals.css. */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-shimmer rounded-[8px]', className)} />;
}
