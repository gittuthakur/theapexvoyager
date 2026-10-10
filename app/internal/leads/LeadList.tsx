import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { FILTER_EMPTY_STATE_CLASS } from '@/components/modules/filters/filterStyles';
import { Skeleton } from '@/components/ui/Skeleton';
import type { InternalLead } from '@/services/leads/lead.service';
import { acquisitionLabel, captureLabel, dateLabel, leadName, titleCase, travellersLabel, unavailable } from './leadDisplay';

export function LeadStatus({ lead }: { lead: InternalLead }) {
  const color = lead.status === 'WON' ? 'bg-emerald-50 text-emerald-800' : lead.status === 'LOST' || lead.status === 'SPAM' ? 'bg-slate-100 text-slate-700' : lead.followUp === 'OVERDUE' ? 'bg-rose-50 text-rose-800' : lead.followUp === 'DUE_TODAY' ? 'bg-amber-50 text-amber-800' : 'bg-sky-50 text-sky-800';
  return <span className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${color}`}>{titleCase(lead.status)}</span>;
}
function Source({ lead }: { lead: InternalLead }) {
  return <><span className="inline-block rounded-md bg-apex-50 px-2 py-1 text-xs font-medium text-apex-800">{captureLabel(lead)}</span><p className="mt-1 text-xs text-slate-600">{acquisitionLabel(lead)}</p>{lead.meta?.campaignName ? <p className="mt-1 text-xs text-slate-600">Campaign: {lead.meta.campaignName}</p> : null}</>;
}
export function LeadList({ leads, loading, hasFilters, onOpen, onReset }: { leads: InternalLead[]; loading: boolean; hasFilters: boolean; onOpen: (id: string) => void; onReset: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loading && scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [loading, leads]);
  if (loading) return <div role="status" aria-label="Loading leads" className="space-y-3 rounded-3xl border border-slate-200 bg-white shadow-md p-4"><p className="text-sm text-slate-600">Loading leads…</p>{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20 w-full animate-none" />)}</div>;
  if (!leads.length) return <div className={`${FILTER_EMPTY_STATE_CLASS} px-4 py-12`}><h3 className="font-semibold">{hasFilters ? 'No matching leads' : 'Your lead inbox is empty'}</h3><p className="mt-2 text-sm text-slate-600">{hasFilters ? 'Try changing your search or clearing the filters.' : 'Website enquiries, Meta leads and manual entries will appear here.'}</p>{hasFilters ? <Button variant="secondary" className="mt-4" onClick={onReset}>Reset filters</Button> : null}</div>;
  return <>
    <div className="hidden min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md lg:block"><p id="lead-table-scroll-hint" className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">Scroll horizontally to see all columns. Customer names stay visible.</p><div ref={scrollRef} className="overflow-x-auto overscroll-x-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-apex-500" aria-describedby="lead-table-scroll-hint" tabIndex={0} role="region" aria-label="Leads management table, scroll horizontally for all columns"><table className="w-full min-w-[1250px] text-left text-sm"><caption className="sr-only">Lead enquiries and recorded follow-up information</caption><thead className="bg-slate-50 text-xs text-slate-600"><tr>{['Customer name', 'Phone', 'Lead source', 'Package / destination', 'Travel date', 'Travellers', 'Status', 'Last contact', 'Next follow-up', 'Actions'].map(h => <th scope="col" key={h} className={`px-4 py-4 align-top font-semibold ${h === 'Customer name' ? 'sticky left-0 z-20 w-56 min-w-56 bg-slate-50 shadow-[2px_0_4px_rgba(15,23,42,0.08)]' : 'whitespace-nowrap'}`}>{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{leads.map(lead => <tr key={lead.id} className="align-top hover:bg-slate-50/70">
        <th scope="row" className="sticky left-0 z-10 w-56 min-w-56 max-w-56 break-words bg-white px-4 py-4 font-medium shadow-[2px_0_4px_rgba(15,23,42,0.08)]"><button className="block w-full break-words text-left text-apex-500 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-apex-500" onClick={() => onOpen(lead.id)}>{leadName(lead)}</button><p className="mt-1 text-xs font-normal text-slate-600">{titleCase(lead.leadType)}</p></th>
        <td className="px-4 py-4">{lead.phone || lead.whatsappNumber || unavailable}</td><td className="min-w-44 max-w-60 break-words px-4 py-4"><Source lead={lead} /></td>
        <td className="min-w-48 max-w-64 break-words px-4 py-4">{lead.journeySlug || lead.destination || unavailable}</td><td className="px-4 py-4">{dateLabel(lead.travelStartDate)}</td><td className="max-w-40 px-4 py-4">{travellersLabel(lead)}</td><td className="px-4 py-4"><LeadStatus lead={lead} /></td><td className="px-4 py-4">{dateLabel(lead.lastContactedAt, true)}</td><td className="px-4 py-4">{dateLabel(lead.nextFollowUpAt, true)}{lead.followUp === 'OVERDUE' ? <p className="mt-1 text-xs font-medium text-rose-700">Overdue</p> : null}</td>
        <td className="px-4 py-4"><Button variant="secondary" size="sm" aria-label={`View details for ${leadName(lead)}`} onClick={() => onOpen(lead.id)}>View details</Button></td>
      </tr>)}</tbody></table></div></div>
    <ul className="grid gap-3 md:grid-cols-2 lg:hidden">{leads.map(lead => <li key={lead.id} className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-md p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 break-words font-semibold">{leadName(lead)}</h3><LeadStatus lead={lead} /></div><p className="mt-1 break-all text-sm text-slate-600">{lead.phone || lead.whatsappNumber || unavailable}</p><div className="mt-3"><Source lead={lead} /></div><dl className="mt-3 space-y-2 text-sm">{[['Package / destination', lead.journeySlug || lead.destination || unavailable], ['Travel date', dateLabel(lead.travelStartDate)], ['Travellers', travellersLabel(lead)], ['Last contact', dateLabel(lead.lastContactedAt, true)], ['Next follow-up', dateLabel(lead.nextFollowUpAt, true)]].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-600">{k}</dt><dd className="break-words">{v}</dd></div>)}</dl><Button variant="secondary" className="mt-4 w-full" aria-label={`View details for ${leadName(lead)}`} onClick={() => onOpen(lead.id)}>View details</Button></li>)}</ul>
  </>;
}
