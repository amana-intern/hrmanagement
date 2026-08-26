import Skeleton from './Skeleton';

function TopBarSkeleton() {
  return (
    <div className="flex-shrink-0 -mt-2 md:-mt-3 lg:-mt-4 bg-amana-neutral-100 rounded-b-[5px] shadow-sm px-3 py-2.5">
      <Skeleton className="h-4 w-28 mb-2" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-4 flex-1 max-w-[220px]" />
        <Skeleton className="h-4 flex-1 max-w-[140px] ml-auto" />
      </div>
      <div className="border-t-2 border-amana-primary-500 mt-2" />
    </div>
  );
}

/** Column-header row + N shimmering body rows, matching DataTable's shape. */
function TableRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-shrink-0 flex gap-3 pb-2 border-b border-amana-neutral-300">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex-shrink-0 flex gap-3 py-2.5 border-b border-amana-neutral-200 last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the common "table inside a SectionCard" page shape.
 * Set `topBar={false}` when embedding inside a page that already has its own topbar rendered.
 */
export function TableSkeleton({
  rows = 6,
  columns = 5,
  topBar = true,
}: {
  rows?: number;
  columns?: number;
  topBar?: boolean;
}) {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      {topBar && <TopBarSkeleton />}
      <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
        <div className="flex-shrink-0 flex items-center justify-between pb-1.5 mb-3 border-b border-amana-primary-500">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <TableRows rows={rows} columns={columns} />
      </div>
    </div>
  );
}

/** Skeleton for Career Hub: assessment-test row + a two-card grid (CV / Certificates). */
export function CareerHubSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <TopBarSkeleton />
      <div className="flex-shrink-0 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-9 w-[139px] flex-shrink-0" />
        </div>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-2.5">
            <Skeleton className="h-5 w-48 mb-1.5" />
            <Skeleton className="h-3 w-64 mb-3" />
            <Skeleton className="flex-1 min-h-[140px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for ProfileOverview: two summary panels + Employee Bio + To-Do List. */
export function ProfileSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <TopBarSkeleton />
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-3 w-full lg:w-3/5 min-h-0">
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
              <Skeleton className="h-5 w-40 pb-1.5 mb-2" />
              <div className="flex gap-2 mb-2">
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} className="h-16 flex-1" />
                ))}
              </div>
              <Skeleton className="flex-1" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-2/5 min-h-0">
          <div className="flex-shrink-0 bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-2 items-end">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="w-[92px] h-[123px] flex-shrink-0" />
            </div>
            <Skeleton className="h-9 w-full mt-3" />
          </div>
          <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
            <Skeleton className="h-5 w-28 mb-3" />
            <Skeleton className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Generic stacked-card skeleton for form/result pages (e.g. Assessment, Assessment Result). */
export function CardStackSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <TopBarSkeleton />
      {Array.from({ length: blocks }).map((_, i) => (
        <div key={i} className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[5px] border border-amana-primary-500 shadow-sm px-5 py-3">
          <Skeleton className="h-5 w-52 mb-3" />
          <Skeleton className="flex-1" />
        </div>
      ))}
    </div>
  );
}
