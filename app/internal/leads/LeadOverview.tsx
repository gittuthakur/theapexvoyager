import { Users, UserPlus, Clock, BadgeCheck, Trophy } from 'lucide-react';
import type { LeadSummary } from '@/services/leads/lead.service';
import { Skeleton } from '@/components/ui/Skeleton';
import { FILTER_PANEL_CLASS } from '@/components/modules/filters/filterStyles';
import { LeadSourceTabs } from './LeadSourceTabs';

export function LeadOverview({ summary, source, onSourceChange }: { summary: LeadSummary | null; source: string; onSourceChange: (source: string) => void }) {
  const metrics = [
    { label: 'Total leads', value: summary?.total, icon: Users },
    { label: 'New leads', value: summary?.newLeads, icon: UserPlus },
    { label: 'Follow-up required', value: summary ? summary.overdue + summary.dueToday : undefined, icon: Clock },
    { label: 'Qualified leads', value: summary?.qualified, icon: BadgeCheck },
    { label: 'Won leads', value: summary?.won, icon: Trophy }
  ];
  return <section aria-label="Dashboard overview" className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
      <Icon size={19} className="mb-3 text-apex-500" aria-hidden="true" /><p className="text-sm text-slate-600">{label}</p>
      {value === undefined ? <Skeleton className="mt-2 h-8 w-16 animate-none" /> : <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>}
      {label === 'Follow-up required' && summary ? <p className="mt-2 text-xs text-slate-600">{summary.overdue} overdue · {summary.dueToday} due today</p> : null}
    </article>)}</div>
    <div className={`${FILTER_PANEL_CLASS} p-4 sm:p-6`}>
      <h2 className="font-semibold">Source breakdown</h2><p className="mt-1 text-xs text-slate-600">All CRM records by stored source. Capture channel does not verify advertising acquisition.</p>
      <div>{summary ? <LeadSourceTabs summary={summary} source={source} onChange={onSourceChange} /> : <Skeleton className="mt-4 h-11 w-full animate-none" />}</div>
      <p className="mt-3 text-xs text-slate-600">Overview totals are global; filters apply to the lead list. Won is a CRM status, not a verified booking confirmation.</p>
    </div>
  </section>;
}
