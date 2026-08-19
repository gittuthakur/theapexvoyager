import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-2xl bg-slate-200', className)} {...props} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-glow">
      <Skeleton className="h-64 w-full rounded-[1.5rem]" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-6 xl:grid-cols-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
