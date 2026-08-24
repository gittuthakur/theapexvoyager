import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface JourneySectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Journey Detail-exclusive — the same titled-card shell every section on this page
// used inline before, pulled out once to avoid repeating the same few classes 13 times.
export default function JourneySection({ title, subtitle, action, className, children }: JourneySectionProps) {
  return (
    <div className={cn('rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
        {action}
      </div>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}
