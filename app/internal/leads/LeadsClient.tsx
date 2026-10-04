'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES } from '@/lib/leads';
import type { InternalLead, LeadSummary } from '@/services/leads/lead.service';

const inputCls = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const btnCls = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50';
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');
const FOLLOW_UPS = [['', 'Any follow-up'], ['overdue', 'Overdue'], ['today', 'Due today'], ['upcoming', 'Upcoming'], ['none', 'None scheduled']];

const displayName = (lead: InternalLead) => lead.name ?? (lead.captureKind === 'META_LEAD_AD' ? 'Meta lead (no name)' : 'WhatsApp click (no contact details)');
const isMeta = (lead: InternalLead) => lead.captureKind === 'META_LEAD_AD' || lead.source === 'meta';

const badge = (lead: InternalLead) =>
  lead.followUp === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : lead.followUp === 'DUE_TODAY' ? 'bg-amber-100 text-amber-800' : lead.status === 'NEW' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init, headers: init?.body ? { 'Content-Type': 'application/json' } : undefined });
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full navigation so the server re-reads the session cookie
  if (response.status === 401) { window.location.href = '/internal/login'; throw new Error('Session expired'); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export default function LeadsClient({ adminEmail }: { adminEmail: string }) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [leads, setLeads] = useState<InternalLead[]>([]);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [selected, setSelected] = useState<InternalLead | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');

  const fetchLeads = useCallback((active: Record<string, string>) => {
    const qs = new URLSearchParams(Object.entries(active).filter(([, v]) => v)).toString();
    return call<{ leads: InternalLead[]; summary: LeadSummary }>(`/api/internal/leads?${qs}`);
  }, []);
  const load = useCallback(async (active: Record<string, string>) => {
    try { const data = await fetchLeads(active); setLeads(data.leads); setSummary(data.summary); setMessage(''); }
    catch (e) { setMessage((e as Error).message); }
  }, [fetchLeads]);
  useEffect(() => {
    let current = true;
    fetchLeads(filters).then(data => { if (current) { setLeads(data.leads); setSummary(data.summary); setMessage(''); } })
      .catch(e => { if (current) setMessage((e as Error).message); });
    return () => { current = false; };
  }, [filters, fetchLeads]);

  async function act(body: Record<string, unknown>) {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const data = await call<{ lead: InternalLead }>(`/api/internal/leads/${selected.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setSelected(data.lead); setNote(''); setMessage(''); await load(filters);
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const body: Record<string, unknown> = {};
    f.forEach((v, k) => { if (typeof v === 'string' && v.trim()) body[k] = k === 'adults' || k === 'children' ? Number(v) : v.trim(); });
    setBusy(true);
    try {
      const data = await call<{ lead: InternalLead }>('/api/internal/leads', { method: 'POST', body: JSON.stringify(body) });
      form.reset(); setShowCreate(false); setSelected(data.lead); setMessage(''); await load(filters);
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }

  async function logout() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full navigation so the server re-reads the session cookie
    try { await fetch('/api/internal/auth/logout', { method: 'POST' }); } finally { window.location.href = '/internal/login'; }
  }

  const set = (key: string) => (e: { target: { value: string } }) => setFilters(prev => ({ ...prev, [key]: e.target.value }));
  const tiles: [string, number | undefined][] = summary
    ? [['New', summary.newLeads], ['Due today', summary.dueToday], ['Overdue', summary.overdue], ['Qualified', summary.qualified], ['Quote sent', summary.quoteSent], ['Won', summary.won], ['Lost', summary.lost]]
    : [];
  const sel = (key: string, label: string, options: readonly string[]) => (
    <select aria-label={label} className={inputCls} value={filters[key] ?? ''} onChange={set(key)}>
      <option value="">{label}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 text-slate-900">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Leads (Internal CRM)</h1>
          <p className="text-sm text-slate-600">Private customer data — signed-in owner only.</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 max-w-full break-all text-xs text-slate-500">{adminEmail}</span>
          <button className={btnCls} onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Close form' : '+ Manual lead'}</button>
          <button className={btnCls} onClick={logout}>Log out</button>
        </div>
      </header>
      {message ? <p role="alert" className="mb-3 break-words rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{message}</p> : null}

      <section aria-label="Summary" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map(([label, n]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold">{n}</p></div>
        ))}
      </section>

      {showCreate ? (
        <form onSubmit={create} className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <input name="name" required maxLength={200} placeholder="Name *" className={inputCls} />
          <input name="phone" maxLength={30} placeholder="Phone *" className={inputCls} />
          <input name="email" type="email" maxLength={200} placeholder="Email" className={inputCls} />
          <select name="leadType" className={inputCls} defaultValue="JOURNEY">{LEAD_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          <select name="source" className={inputCls} defaultValue="manual">{LEAD_SOURCES.map(t => <option key={t}>{t}</option>)}</select>
          <input name="destination" maxLength={200} placeholder="Destination / package" className={inputCls} />
          <input name="travelStartDate" type="date" className={inputCls} />
          <input name="adults" type="number" min={0} max={100} placeholder="Adults" className={inputCls} />
          <input name="children" type="number" min={0} max={100} placeholder="Children" className={inputCls} />
          <textarea name="message" required maxLength={5000} rows={3} placeholder="Requirements *" className={`${inputCls} sm:col-span-2 lg:col-span-3`} />
          <button className={btnCls} disabled={busy}>Save lead</button>
        </form>
      ) : null}

      <section aria-label="Filters" className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input aria-label="Search" placeholder="Search name, phone, email, package" className={inputCls} value={filters.q ?? ''} onChange={set('q')} />
        {sel('status', 'Any status', LEAD_STATUSES)}{sel('source', 'Any source', LEAD_SOURCES)}{sel('leadType', 'Any type', LEAD_TYPES)}
        {sel('priority', 'Any priority', LEAD_PRIORITIES)}
        <select aria-label="Follow-up" className={inputCls} value={filters.followUp ?? ''} onChange={set('followUp')}>{FOLLOW_UPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input aria-label="Destination or package" placeholder="Destination / package" className={inputCls} value={filters.destination ?? ''} onChange={set('destination')} />
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="From date" type="date" className={inputCls} value={filters.from ?? ''} onChange={set('from')} />
          <input aria-label="To date" type="date" className={inputCls} value={filters.to ?? ''} onChange={set('to')} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-label="Lead list" className="min-w-0">
          {leads.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No leads match.</p> : null}
          <ul className="space-y-2">
            {leads.map(lead => (
              <li key={lead.id}>
                <button onClick={() => { setSelected(lead); setFollowUp(''); }} className={`w-full min-w-0 rounded-xl border bg-white p-3 text-left ${selected?.id === lead.id ? 'border-slate-900' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-semibold">{displayName(lead)}</p>
                    <span className="flex flex-wrap gap-1">{isMeta(lead) ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">Meta</span> : null}<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge(lead)}`}>{lead.followUp === 'OVERDUE' ? 'OVERDUE' : lead.status}</span></span>
                  </div>
                  <p className="break-words text-sm text-slate-600">{lead.journeySlug ?? lead.destination ?? '—'} · {lead.leadType} · {lead.source}</p>
                  <p className="break-all text-xs text-slate-500">{lead.phone ?? lead.email ?? 'no contact'} · {lead.priority} · travel {fmtDay(lead.travelStartDate)} · follow-up {fmtDay(lead.nextFollowUpAt)} · created {fmtDay(lead.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside aria-label="Lead detail" className="min-w-0">
          {selected ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <h2 className="break-words text-lg font-bold">{displayName(selected)}</h2>
              <p className="break-all">{selected.phone ?? '—'} · {selected.email ?? '—'}</p>
              <div className="flex flex-wrap gap-2">
                {selected.phone ? <a className={btnCls} href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}>Call</a> : null}
                {selected.phone ? <a className={btnCls} target="_blank" rel="noopener noreferrer" href={`https://wa.me/${selected.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`}>WhatsApp</a> : null}
                <button className={btnCls} disabled={busy} onClick={() => act({ action: 'record_contacted' })}>Record contacted</button>
              </div>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                {([
                  ['Kind', selected.captureKind], ['Type', selected.leadType], ['Destination', selected.destination], ['Package', selected.journeySlug],
                  ['Travel', `${fmtDay(selected.travelStartDate)} → ${fmtDay(selected.travelEndDate)}`],
                  ['Travellers', `${selected.adults ?? '—'} adults, ${selected.children ?? 0} children`], ['Budget', selected.budget],
                  ['Source', `${selected.source}${selected.sourceDetail ? ` (${selected.sourceDetail})` : ''}`],
                  ['UTM', [selected.utmSource, selected.utmMedium, selected.utmCampaign, selected.utmContent, selected.utmTerm].filter(Boolean).join(' / ')],
                  ['Landing', selected.landingPage], ['Referrer', selected.referrer], ['Last contacted', fmt(selected.lastContactedAt)],
                  ['Follow-up', fmt(selected.nextFollowUpAt)], ['Created', fmt(selected.createdAt)], ['Duplicate of', selected.duplicateOf]
                ] as [string, string | undefined][]).map(([k, v]) => v ? (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="break-words">{v}</dd></div>) : null)}
              </dl>
              {selected.message ? <p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2">{selected.message}</p> : null}
              {selected.meta ? (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-2 text-xs">
                  <p className="font-semibold text-indigo-900">Meta Lead Ad</p>
                  <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                    {([['Campaign', selected.meta.campaignName ?? selected.meta.campaignId], ['Ad set', selected.meta.adSetName ?? selected.meta.adSetId], ['Ad', selected.meta.adName ?? selected.meta.adId], ['Form', selected.meta.formName ?? selected.meta.formId], ['Platform', selected.meta.platform], ['Submitted', fmt(selected.meta.createdTime)], ['Meta lead id', selected.meta.leadId]] as [string, string | undefined][]).map(([k, v]) => v && v !== '—' ? (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="break-all">{v}</dd></div>) : null)}
                  </dl>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <select aria-label="Status" className={inputCls} value={selected.status} disabled={busy}
                  onChange={e => act({ action: 'set_status', status: e.target.value, reopen: true })}>{LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                <select aria-label="Priority" className={inputCls} value={selected.priority} disabled={busy}
                  onChange={e => act({ action: 'set_priority', priority: e.target.value })}>{LEAD_PRIORITIES.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['WON', 'LOST', 'SPAM'] as const).map(s => <button key={s} className={btnCls} disabled={busy || selected.status === s} onClick={() => act({ action: 'set_status', status: s })}>Mark {s.toLowerCase()}</button>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <input aria-label="Next follow-up" type="datetime-local" className={`${inputCls} flex-1`} value={followUp} onChange={e => setFollowUp(e.target.value)} />
                <button className={btnCls} disabled={busy || !followUp} onClick={() => act({ action: 'schedule_follow_up', at: new Date(followUp).toISOString() })}>Set</button>
                <button className={btnCls} disabled={busy || !selected.nextFollowUpAt} onClick={() => act({ action: 'schedule_follow_up', at: null })}>Clear</button>
              </div>
              <div className="flex gap-2">
                <textarea aria-label="Add note" rows={2} maxLength={2000} className={inputCls} placeholder="Internal note" value={note} onChange={e => setNote(e.target.value)} />
                <button className={btnCls} disabled={busy || !note.trim()} onClick={() => act({ action: 'add_note', text: note })}>Add</button>
              </div>
              <ol className="space-y-1 border-t border-slate-200 pt-2">
                {[...selected.events].reverse().map((ev, i) => (
                  <li key={i} className="break-words text-xs text-slate-600"><span className="font-medium">{ev.type}</span> · {fmt(ev.at)} · {ev.actor}{ev.from || ev.to ? ` · ${ev.from ?? ''} → ${ev.to ?? ''}` : ''}{ev.text ? ` — ${ev.text}` : ''}</li>
                ))}
              </ol>
            </div>
          ) : <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Select a lead to see details.</p>}
        </aside>
      </div>
    </main>
  );
}
