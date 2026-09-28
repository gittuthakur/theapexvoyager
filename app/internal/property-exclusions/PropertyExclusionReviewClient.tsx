'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SerializedExclusion {
  id: string;
  provider: string;
  providerPlaceId: string;
  propertyName?: string;
  reason?: string;
  requestedBy?: string;
  requestDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  active: SerializedExclusion[];
  inactive: SerializedExclusion[];
}

async function postJSON(url: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function PropertyExclusionReviewClient({ active, inactive }: Props) {
  const router = useRouter();
  const [providerPlaceId, setProviderPlaceId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [reason, setReason] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const { ok, data } = await postJSON('/api/internal/property-exclusions', {
      provider: 'google',
      providerPlaceId,
      propertyName: propertyName || undefined,
      reason: reason || undefined,
      requestedBy: requestedBy || undefined,
      notes: notes || undefined
    });
    setSubmitting(false);
    if (!ok) {
      setMessage(`Failed: ${data.error ?? 'unknown error'}`);
      return;
    }
    setProviderPlaceId('');
    setPropertyName('');
    setReason('');
    setRequestedBy('');
    setNotes('');
    setMessage('Exclusion added.');
    router.refresh();
  }

  async function handleDeactivate(id: string) {
    setBusyId(id);
    setMessage(null);
    const { ok, data } = await postJSON(`/api/internal/property-exclusions/${id}/deactivate`);
    setBusyId(null);
    if (!ok) {
      setMessage(`Failed: ${data.error ?? 'unknown error'}`);
      return;
    }
    setMessage('Exclusion deactivated — the property is eligible to appear again.');
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Property Exclusions (Internal)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Excludes a Google-sourced property from every public surface (search, listings, catalog, direct URL) by its stable Google Place ID.
        </p>
      </div>

      {message ? <p className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">{message}</p> : null}

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add exclusion</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="providerPlaceId">
            Google Place ID *
          </label>
          <input
            id="providerPlaceId"
            required
            value={providerPlaceId}
            onChange={(event) => setProviderPlaceId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="ChIJ..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="propertyName">
            Property name (for reference only — never used to match)
          </label>
          <input
            id="propertyName"
            value={propertyName}
            onChange={(event) => setPropertyName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="reason">
            Reason
          </label>
          <input
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Owner requested removal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="requestedBy">
            Requested by (free text — no personal contact details needed)
          </label>
          <input
            id="requestedBy"
            value={requestedBy}
            onChange={(event) => setRequestedBy(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !providerPlaceId.trim()}
          className="rounded-full bg-apex-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add exclusion'}
        </button>
      </form>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active exclusions ({active.length})</h2>
        <ul className="mt-3 space-y-2">
          {active.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{row.propertyName ?? row.providerPlaceId}</p>
                <p className="text-xs text-slate-500">
                  {row.provider}:{row.providerPlaceId}
                  {row.reason ? ` · ${row.reason}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeactivate(row.id)}
                disabled={busyId === row.id}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                {busyId === row.id ? 'Working…' : 'Deactivate'}
              </button>
            </li>
          ))}
          {active.length === 0 ? <li className="text-sm text-slate-500">No active exclusions.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">History ({inactive.length})</h2>
        <ul className="mt-3 space-y-2">
          {inactive.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
              {row.propertyName ?? row.providerPlaceId} ({row.provider}:{row.providerPlaceId}) — deactivated
            </li>
          ))}
          {inactive.length === 0 ? <li className="text-sm text-slate-500">No history.</li> : null}
        </ul>
      </section>
    </main>
  );
}
