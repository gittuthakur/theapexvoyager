import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { LeadPagination as Pagination } from '@/services/leads/lead.service';

export function LeadPagination({ pagination, loading, onNavigate }: {
  pagination: Pagination; loading: boolean; onNavigate: (direction: 'previous' | 'next') => void;
}) {
  const { page, shown, total, hasPrevious, hasNext } = pagination;
  return <nav aria-label="Lead pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
    <div className="text-sm text-slate-600" role="status" aria-live="polite" aria-atomic="true">
      <p>{loading ? 'Loading results…' : `${shown} leads shown · ${total} currently matching in this view`}</p>
      <p className="mt-1 text-xs">Page {page} · Up to 10 leads per page</p>
      <p className="mt-1 max-w-lg text-xs">Visited pages keep their lead positions. Changes may shorten a page. Refresh to include new leads and restart this 30-minute view.</p>
    </div>
    <div className="flex max-w-full flex-wrap items-center gap-1.5">
      <Button type="button" variant="secondary" size="sm" className="min-h-11 px-3" disabled={loading || !hasPrevious} onClick={() => onNavigate('previous')}><ChevronLeft size={16} aria-hidden="true" />Previous</Button>
      <span aria-current="page" aria-label={`Page ${page}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-apex-500 px-3 text-sm font-semibold text-white">{page}</span>
      <Button type="button" variant="secondary" size="sm" className="min-h-11 px-3" disabled={loading || !hasNext} onClick={() => onNavigate('next')}>Next<ChevronRight size={16} aria-hidden="true" /></Button>
    </div>
  </nav>;
}
