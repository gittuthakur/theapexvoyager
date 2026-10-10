'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { InternalLead, LeadSummary } from '@/services/leads/lead.service';
import { LeadOverview } from './LeadOverview';
import { LeadFilters, type LeadFilterValues } from './LeadFilters';
import { LeadList } from './LeadList';
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
  const [filters, setFilters] = useState<LeadFilterValues>({});
  const [leads, setLeads] = useState<InternalLead[]>([]);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
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
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    const timer = setTimeout(() => {
      call<{ leads: InternalLead[]; summary: LeadSummary }>(`/api/internal/leads?${query}`, { signal: controller.signal })
        .then(data => { if (!controller.signal.aborted) { setLeads(data.leads); setSummary(data.summary); setError(''); setLoading(false); } })
        .catch(e => { if (!controller.signal.aborted) { setError(e instanceof Error ? e.message : 'Unable to load leads'); setLoading(false); } });
    }, filters.q ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, refresh]);
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
  function resetFilters() { setLoading(true); setError(''); setFilters({}); }
  async function act(body: Record<string, unknown>) {
    if (!selected || mutationLock.current) return false;
    mutationLock.current = true; setBusy(true); setDetailError('');
    try {
      const data = await call<{ lead: InternalLead }>(`/api/internal/leads/${selected.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setSelected(data.lead); setRefresh(v => v + 1); return true;
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
      form.reset(); setShowCreate(false); setRefresh(v => v + 1); openDetail(data.lead.id);
    } catch (e) { setCreateError(e instanceof Error ? e.message : 'Unable to create lead'); }
    finally { mutationLock.current = false; setBusy(false); }
  }
  async function logout() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- server must re-read the session
    try { await fetch('/api/internal/auth/logout', { method: 'POST' }); } finally { window.location.href = '/internal/login'; }
  }
  const hasFilters = Object.values(filters).some(Boolean);
  return <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-6 text-slate-900 sm:px-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-apex-700">Internal CRM</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Leads</h1><p className="mt-2 text-sm text-slate-600">Manage enquiries, travel requirements and follow-ups.</p><p className="mt-1 break-all text-xs text-slate-600">Signed in as {adminEmail}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => setShowCreate(v => !v)}><Plus size={16} aria-hidden="true" />Manual lead</Button><Button variant="secondary" size="sm" disabled={busy} onClick={logout}>Log out</Button></div></header>
    <LeadOverview summary={summary} />
    {showCreate ? <ManualLeadForm busy={busy} error={createError} create={create} /> : null}
    <LeadFilters filters={filters} onChange={(key, value) => { setLoading(true); setError(''); setFilters(prev => ({ ...prev, [key]: value })); }} onReset={resetFilters} />
    <section aria-label="Lead inbox" className="min-w-0 space-y-3" aria-busy={loading}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Lead inbox</h2><p className="text-xs text-slate-600">{loading ? 'Loading results…' : error ? 'Results unavailable' : `${leads.length} ${hasFilters ? 'matching' : 'loaded'} records`} · Dates shown in India time</p></div><Button variant="secondary" size="sm" disabled={loading} onClick={() => { setLoading(true); setRefresh(v => v + 1); }}><RefreshCw size={15} aria-hidden="true" />Refresh</Button></div>
      {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{error}</p><Button variant="secondary" className="mt-3" onClick={() => { setLoading(true); setError(''); setRefresh(v => v + 1); }}>Retry</Button></div> : <LeadList leads={leads} loading={loading} hasFilters={hasFilters} onOpen={openDetail} onReset={resetFilters} />}
    </section>
    <LeadDetailDrawer open={selectedId !== null} lead={selected} loading={detailLoading} error={detailError} busy={busy} onClose={closeDetail} onRetry={() => { setDetailLoading(true); setDetailError(''); setDetailRefresh(v => v + 1); }} onAction={act} />
  </main>;
}
