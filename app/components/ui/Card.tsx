import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({ children, className = '', padding = 'md', hover = true }: CardProps) {
  const p = padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6';
  return (
    <div
      className={`bg-white rounded-2xl border border-amana-sec-6 shadow-sm ${
        hover ? 'hover:shadow-lg hover:border-amana-blue/20 hover:-translate-y-0.5' : ''
      } transition-all duration-300 ${p} ${className}`}
    >
      {children}
    </div>
  );
}
