'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { InternalLead, LeadPage, LeadPagination as Pagination, LeadSummary } from '@/services/leads/lead.service';
import { LeadOverview } from './LeadOverview';
import { LeadFilters, type LeadFilterValues } from './LeadFilters';
import { LeadList } from './LeadList';
import { LeadPagination } from './LeadPagination';
import { sourceTabId } from './LeadSourceTabs';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { ManualLeadForm } from './ManualLeadForm';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init, headers: init?.body ? { 'Content-Type': 'application/json' } : undefined });
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- server must re-read the session
  if (response.status === 401) { window.location.href = '/internal/login'; throw new Error('Session expired'); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}
export default function LeadsClient({ adminEmail }: { adminEmail: string }) {
  const [query, setQuery] = useState<{ filters: LeadFilterValues; page: number; cursor?: string }>({ filters: {}, page: 1 });
  const { filters, page } = query;
  const [leads, setLeads] = useState<InternalLead[]>([]);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const requestVersion = useRef(0);
  const pageHistory = useRef<string[]>([]);
  const [visitedPages, setVisitedPages] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<InternalLead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRefresh, setDetailRefresh] = useState(0);
  const mutationLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const version = requestVersion.current;
    const params = new URLSearchParams(Object.entries(query.filters).filter(([, value]) => value));
    params.set('pagination', 'cursor');
    if (query.cursor) params.set('cursor', query.cursor);
    const timer = setTimeout(() => {
      call<LeadPage & { summary: LeadSummary }>(`/api/internal/leads?${params}`, { signal: controller.signal })
        .then(data => {
          if (controller.signal.aborted || version !== requestVersion.current) return;
          setLeads(data.leads); setSummary(data.summary); setPagination(data.pagination); setError(''); setLoading(false);
          pageHistory.current[query.page - 1] = data.pagination.cursor;
          setVisitedPages(value => Math.max(value, query.page));
        })
        .catch(e => {
          if (!controller.signal.aborted && version === requestVersion.current) {
            setError(e instanceof Error ? e.message : 'Unable to load leads'); setLoading(false);
          }
        });
    }, query.filters.q || query.filters.destination ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, refresh]);
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    call<{ lead: InternalLead }>(`/api/internal/leads/${selectedId}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setSelected(data.lead); setDetailLoading(false); } })
      .catch(e => { if (!controller.signal.aborted) { setDetailError(e instanceof Error ? e.message : 'Unable to load lead'); setDetailLoading(false); } });
    return () => controller.abort();
  }, [selectedId, detailRefresh]);
  const closeDetail = useCallback(() => { if (!mutationLock.current) { setSelectedId(null); setSelected(null); setDetailError(''); } }, []);
  function openDetail(id: string) { setSelected(null); setDetailError(''); setDetailLoading(true); setSelectedId(id); setDetailRefresh(v => v + 1); }
  function changeQuery(next: { filters: LeadFilterValues; page: number; cursor?: string }) {
    if (!next.cursor) { pageHistory.current = []; setVisitedPages(0); }
    requestVersion.current += 1; setLoading(true); setError(''); setQuery(next);
  }
  function changeFilter(key: string, value: string) { changeQuery({ filters: { ...filters, [key]: value }, page: 1 }); }
  function resetFilters() { changeQuery({ filters: {}, page: 1 }); }
  function refreshList() { changeQuery({ filters, page: 1 }); setRefresh(v => v + 1); }
  function navigate(direction: 'previous' | 'next') {
    if (loading || !pagination) return;
    const nextPage = direction === 'next' ? page + 1 : page - 1;
    const cursor = direction === 'next' ? pageHistory.current[nextPage - 1] ?? pagination.nextCursor : pageHistory.current[nextPage - 1];
    if (!cursor || nextPage < 1) return;
    if (nextPage > 1000) { setError('Navigation limit reached. Refresh the lead list.'); return; }
    changeQuery({ filters, page: nextPage, cursor });
  }
  async function act(body: Record<string, unknown>) {
    if (!selected || mutationLock.current) return false;
    mutationLock.current = true; setBusy(true); setDetailError('');
    try {
      const data = await call<{ lead: InternalLead }>(`/api/internal/leads/${selected.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setSelected(data.lead); refreshList(); return true;
    } catch (e) { setDetailError(e instanceof Error ? e.message : 'Unable to save changes'); return false; }
    finally { mutationLock.current = false; setBusy(false); }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (mutationLock.current) return;
    const form = event.currentTarget; const body: Record<string, unknown> = {};
    new FormData(form).forEach((v, k) => { if (typeof v === 'string' && v.trim()) body[k] = k === 'adults' || k === 'children' ? Number(v) : v.trim(); });
    mutationLock.current = true; setBusy(true); setCreateError('');
    try {
      const data = await call<{ lead: InternalLead }>('/api/internal/leads', { method: 'POST', body: JSON.stringify(body) });
      form.reset(); setShowCreate(false); changeQuery({ filters, page: 1 }); setRefresh(v => v + 1); openDetail(data.lead.id);
    } catch (e) { setCreateError(e instanceof Error ? e.message : 'Unable to create lead'); }
    finally { mutationLock.current = false; setBusy(false); }
  }
  async function logout() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- server must re-read the session
    try { await fetch('/api/internal/auth/logout', { method: 'POST' }); } finally { window.location.href = '/internal/login'; }
  }
  const hasFilters = Object.values(filters).some(Boolean);
  return <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-6 text-slate-900 sm:px-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-apex-500">Internal CRM</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Leads</h1><p className="mt-2 text-sm text-slate-600">Manage enquiries, travel requirements and follow-ups.</p><p className="mt-1 break-all text-xs text-slate-600">Signed in as {adminEmail}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => setShowCreate(v => !v)}><Plus size={16} aria-hidden="true" />Manual lead</Button><Button variant="secondary" size="sm" disabled={busy} onClick={logout}>Log out</Button></div></header>
    <LeadOverview summary={summary} source={filters.source ?? ''} onSourceChange={value => changeFilter('source', value)} />
    {showCreate ? <ManualLeadForm busy={busy} error={createError} create={create} /> : null}
    <LeadFilters filters={filters} page={page} onChange={changeFilter} onReset={resetFilters} />
    <section id="lead-results" role="tabpanel" aria-labelledby={summary ? sourceTabId(filters.source) : undefined} aria-label="Lead inbox" className="min-w-0 space-y-3" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Lead inbox</h2><p className="text-xs text-slate-600">Dates shown in India time · Filters apply to results below</p></div><Button variant="secondary" size="sm" disabled={loading} onClick={refreshList}><RefreshCw size={15} aria-hidden="true" />Refresh</Button></div>
      {error ? <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{error}</p><Button variant="secondary" className="mt-3" onClick={refreshList}>Retry</Button></div> : <>
        {!loading && pagination && page > 1 && !leads.length ? <p role="status" className="text-sm text-slate-600">Leads on this page no longer match or were removed. Use Previous, Next or Refresh.</p> : null}
        {loading || !pagination || page === 1 || leads.length > 0 ? <LeadList leads={leads} loading={loading} hasFilters={hasFilters} onOpen={openDetail} onReset={resetFilters} /> : null}
        {pagination ? <LeadPagination pagination={{ ...pagination, hasNext: pagination.hasNext || page < visitedPages }} loading={loading} onNavigate={navigate} /> : null}
      </>}
    </section>
    <LeadDetailDrawer open={selectedId !== null} lead={selected} loading={detailLoading} error={detailError} busy={busy} onClose={closeDetail} onRetry={() => { setDetailLoading(true); setDetailError(''); setDetailRefresh(v => v + 1); }} onAction={act} />
  </main>;
}
