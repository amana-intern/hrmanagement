import type { ReactNode } from 'react';

export default function FormActions({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex justify-end mt-6 pt-4 border-t border-amana-sec-6 ${className}`}>
      {children}
    </div>
  );
}
