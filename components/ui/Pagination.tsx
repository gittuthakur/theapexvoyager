'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

// Always keeps the first page, the last page, and a window around the current
// page — collapsing everything else into a single ".." rather than listing
// every page number once the list gets long.
function getPageList(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  const kept = Array.from(keep)
    .filter((candidate) => candidate >= 1 && candidate <= totalPages)
    .sort((a, b) => a - b);

  const withEllipses: Array<number | 'ellipsis'> = [];
  kept.forEach((entry, index) => {
    if (index > 0 && entry - kept[index - 1] > 1) withEllipses.push('ellipsis');
    withEllipses.push(entry);
  });
  return withEllipses;
}

export default function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={Boolean(page <= 1)}
        aria-label="Previous page"
        className="cursor-hover inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>

      {getPageList(page, totalPages).map((entry, index) =>
        entry === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-slate-500">
            ..
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              'cursor-hover inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition',
              entry === page ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            )}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={Boolean(page >= totalPages)}
        className="cursor-hover inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
