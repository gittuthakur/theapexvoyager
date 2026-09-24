'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HIGH_CONFIDENCE_DISTANCE_METERS, HIGH_CONFIDENCE_NAME_THRESHOLD } from '@/services/pricing/hotelMapping.service';

export interface SerializedMapping {
  id: string;
  googlePlaceId: string;
  destinationSlug: string;
  provider: string;
  providerHotelId: string;
  providerDestinationCode: string;
  googleHotelName: string;
  providerHotelName: string;
  googleLatitude?: number;
  googleLongitude?: number;
  providerLatitude?: number;
  providerLongitude?: number;
  nameSimilarity: number;
  distanceMeters?: number;
  hasCoordinateAnomaly: boolean;
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'DISABLED';
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type Tab = 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'DISABLED';

interface Props {
  pending: SerializedMapping[];
  confirmed: SerializedMapping[];
  rejected: SerializedMapping[];
  disabled: SerializedMapping[];
  destinations: { slug: string; hbxName: string }[];
}

// Display-only labeling — mirrors the exact HIGH_CONFIDENCE thresholds the scorer uses
// (services/pricing/hotelMapping.service.ts), but never touches the stored `status`.
// The reviewer is the only thing that can ever change status.
function displayClassification(row: SerializedMapping): 'strong' | 'coordinate_warning' | 'needs_review' {
  if (row.hasCoordinateAnomaly) return 'coordinate_warning';
  if (row.nameSimilarity >= HIGH_CONFIDENCE_NAME_THRESHOLD && row.distanceMeters !== undefined && row.distanceMeters <= HIGH_CONFIDENCE_DISTANCE_METERS) {
    return 'strong';
  }
  return 'needs_review';
}

const CLASSIFICATION_LABEL: Record<ReturnType<typeof displayClassification>, string> = {
  strong: 'Strong candidate',
  coordinate_warning: 'Coordinate warning',
  needs_review: 'Needs careful review'
};

const CLASSIFICATION_CLASS: Record<ReturnType<typeof displayClassification>, string> = {
  strong: 'bg-green-100 text-green-800 border-green-300',
  coordinate_warning: 'bg-red-100 text-red-800 border-red-300',
  needs_review: 'bg-amber-100 text-amber-800 border-amber-300'
};

function maskId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function mapsLink(lat?: number, lon?: number): string | undefined {
  if (lat === undefined || lon === undefined) return undefined;
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

function sortPending(rows: SerializedMapping[]): SerializedMapping[] {
  return [...rows].sort((a, b) => {
    if (b.nameSimilarity !== a.nameSimilarity) return b.nameSimilarity - a.nameSimilarity;
    const aDist = a.distanceMeters ?? Number.POSITIVE_INFINITY;
    const bDist = b.distanceMeters ?? Number.POSITIVE_INFINITY;
    return aDist - bDist;
  });
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

export default function HotelMappingReviewClient({ pending, confirmed, rejected, disabled, destinations }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('PENDING_REVIEW');
  const [reviewer, setReviewer] = useState('local-admin');
  const [destinationSlug, setDestinationSlug] = useState(destinations[0]?.slug ?? '');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rowsByTab: Record<Tab, SerializedMapping[]> = {
    PENDING_REVIEW: sortPending(pending),
    CONFIRMED: confirmed,
    REJECTED: rejected,
    DISABLED: disabled
  };

  async function handleConfirm(id: string) {
    if (!reviewer.trim()) {
      setMessage('A reviewer identifier is required before confirming a mapping.');
      return;
    }
    setBusyId(id);
    setMessage(null);
    const { ok, data } = await postJSON(`/api/internal/hotel-mappings/${id}/confirm`, { confirmedBy: reviewer.trim() });
    setBusyId(null);
    setMessage(ok ? 'Mapping confirmed.' : `Confirm failed: ${data.error ?? 'unknown error'}`);
    if (ok) router.refresh();
  }

  async function handleReject(id: string) {
    setBusyId(id);
    setMessage(null);
    const { ok, data } = await postJSON(`/api/internal/hotel-mappings/${id}/reject`);
    setBusyId(null);
    setMessage(ok ? 'Mapping rejected.' : `Reject failed: ${data.error ?? 'unknown error'}`);
    if (ok) router.refresh();
  }

  async function handleDisable(id: string) {
    setBusyId(id);
    setMessage(null);
    const { ok, data } = await postJSON(`/api/internal/hotel-mappings/${id}/disable`);
    setBusyId(null);
    setMessage(ok ? 'Mapping disabled.' : `Disable failed: ${data.error ?? 'unknown error'}`);
    if (ok) router.refresh();
  }

  async function handleGenerate() {
    if (!destinationSlug) return;
    setGenerating(true);
    setGenerationSummary(null);
    setMessage(null);
    const { ok, data } = await postJSON('/api/internal/hotel-mappings/generate', { destinationSlug, provider: 'hbx' });
    setGenerating(false);
    if (ok) {
      setGenerationSummary(data.summary as Record<string, unknown>);
      router.refresh();
    } else {
      setMessage(`Candidate generation failed: ${data.error ?? 'unknown error'}`);
    }
  }

  const rows = rowsByTab[tab];

  return (
    <main className="mx-auto max-w-6xl p-6 font-sans text-sm text-slate-900">
      <h1 className="text-xl font-bold">Hotel Provider Mapping Review</h1>
      <p className="mt-1 text-slate-600">
        Internal, local-development-only tool. No automatic confirmation. No HBX Availability/CheckRate/Booking calls happen from this
        page — candidate generation uses the HBX Content API only.
      </p>

      <section className="mt-6 rounded-lg border border-slate-300 p-4">
        <h2 className="font-semibold">Generate candidates</h2>
        <p className="mt-1 text-slate-600">Restricted to explicitly verified destinations (config/hbxDestinations.config.ts).</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={destinationSlug}
            onChange={(e) => setDestinationSlug(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5"
          >
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.hbxName} ({d.slug})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !destinationSlug}
            className="rounded bg-slate-900 px-4 py-1.5 font-semibold text-white disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Candidates'}
          </button>
        </div>
        {generationSummary ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 rounded bg-slate-50 p-3 sm:grid-cols-4">
            {Object.entries(generationSummary).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt>
                <dd className="font-semibold">{String(value)}</dd>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">HBX requests consumed</dt>
              <dd className="font-semibold">1 (Content API only — no Availability/CheckRate/Booking call is ever made by this action)</dd>
            </div>
          </dl>
        ) : null}
      </section>

      {message ? <p className="mt-4 rounded border border-slate-300 bg-white p-3">{message}</p> : null}

      <nav className="mt-6 flex gap-2 border-b border-slate-300">
        {(['PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'DISABLED'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 font-semibold ${tab === t ? 'border-b-2 border-slate-900' : 'text-slate-500'}`}
          >
            {t.replace('_', ' ')} ({rowsByTab[t].length})
          </button>
        ))}
      </nav>

      {tab === 'PENDING_REVIEW' ? (
        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="reviewer" className="font-semibold">
            Reviewer:
          </label>
          <input
            id="reviewer"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          />
          <span className="text-xs text-slate-500">Local development identifier only — not production authentication.</span>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? <p className="text-slate-500">No mappings in this status.</p> : null}
        {rows.map((row) => {
          const classification = displayClassification(row);
          const googleMap = mapsLink(row.googleLatitude, row.googleLongitude);
          const providerMap = mapsLink(row.providerLatitude, row.providerLongitude);
          return (
            <div key={row.id} className="rounded-lg border border-slate-300 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {row.googleHotelName} <span className="font-normal text-slate-500">↔</span> {row.providerHotelName}
                  </p>
                  <p className="text-slate-600">
                    {row.provider.toUpperCase()} · {row.destinationSlug} ({row.providerDestinationCode})
                  </p>
                </div>
                <span className={`shrink-0 rounded border px-2 py-1 text-xs font-semibold ${CLASSIFICATION_CLASS[classification]}`}>
                  {CLASSIFICATION_LABEL[classification]}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Google Place ID</dt>
                  <dd>{maskId(row.googlePlaceId)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Provider hotel ID</dt>
                  <dd>{row.providerHotelId}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Name similarity</dt>
                  <dd>{row.nameSimilarity.toFixed(3)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Distance</dt>
                  <dd>{row.distanceMeters !== undefined ? `${Math.round(row.distanceMeters)} m` : 'unknown'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Coordinate anomaly</dt>
                  <dd>{row.hasCoordinateAnomaly ? 'YES' : 'no'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                  <dd>{row.status}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Created</dt>
                  <dd>{new Date(row.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Updated</dt>
                  <dd>{new Date(row.updatedAt).toLocaleString()}</dd>
                </div>
                {row.confirmedBy ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Confirmed by</dt>
                    <dd>
                      {row.confirmedBy} {row.confirmedAt ? `at ${new Date(row.confirmedAt).toLocaleString()}` : ''}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {googleMap ? (
                  <a href={googleMap} target="_blank" rel="noopener noreferrer" className="underline">
                    Google property on map
                  </a>
                ) : (
                  <span className="text-slate-400">Google coordinates unavailable</span>
                )}
                {providerMap ? (
                  <a href={providerMap} target="_blank" rel="noopener noreferrer" className="underline">
                    Provider property on map
                  </a>
                ) : (
                  <span className="text-slate-400">Provider coordinates unavailable</span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                {row.status === 'PENDING_REVIEW' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConfirm(row.id)}
                      disabled={busyId === row.id}
                      className="rounded bg-green-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(row.id)}
                      disabled={busyId === row.id}
                      className="rounded bg-red-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {row.status === 'CONFIRMED' ? (
                  <button
                    type="button"
                    onClick={() => handleDisable(row.id)}
                    disabled={busyId === row.id}
                    className="rounded bg-slate-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
                  >
                    Disable
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
