import type { ReactNode } from 'react';

export default function EmptyState({
  message,
  icon,
  action,
}: {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-sm text-amana-blue font-semibold">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
