'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { SafeImage } from '@/components/ui/SafeImage';
import { getJSON } from '@/lib/api';
import type { Destination, DestinationMatchScores } from '@/types';

export interface DestinationMatchModalProps {
  open: boolean;
  onClose: () => void;
}

interface MatchResult {
  destination: Destination;
  score: number;
}

interface MatchResponse {
  preferences: DestinationMatchScores;
  results: MatchResult[];
}

const SLIDERS: Array<{ key: keyof DestinationMatchScores; label: string }> = [
  { key: 'adventure', label: 'Adventure' },
  { key: 'nature', label: 'Nature' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'crowds', label: 'Low Crowds' },
  { key: 'slowTravel', label: 'Slow Travel' }
];

const DEFAULT_PREFERENCES: DestinationMatchScores = {
  adventure: 50,
  nature: 50,
  luxury: 50,
  crowds: 50,
  slowTravel: 50
};

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function DestinationMatchModal({ open, onClose }: DestinationMatchModalProps) {
  const [preferences, setPreferences] = useState<DestinationMatchScores>(DEFAULT_PREFERENCES);
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<MatchResult[]>([]);

  function handleClose() {
    onClose();
    // Reset after the close animation has a moment to play so returning visitors
    // see a fresh set of sliders instead of their previous results.
    setTimeout(() => {
      setStatus('idle');
      setResults([]);
      setPreferences(DEFAULT_PREFERENCES);
    }, 200);
  }

  async function handleFindMatch() {
    setStatus('loading');
    try {
      const params = new URLSearchParams({
        adventure: String(preferences.adventure),
        nature: String(preferences.nature),
        luxury: String(preferences.luxury),
        crowds: String(preferences.crowds),
        slowTravel: String(preferences.slowTravel)
      });
      const data = await getJSON<MatchResponse>(`/api/destinations/match?${params.toString()}`);
      setResults(data.results.slice(0, 3));
      setStatus('success');
    } catch (error) {
      console.error('Failed to fetch destination match', error);
      setStatus('error');
    }
  }

  return (
    <FloatingOverlay
      open={open}
      onClose={handleClose}
      labelledBy="destination-match-modal-title"
      overlayClassName="bg-slate-950/70 backdrop-blur-sm"
      panelClassName="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-glow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">Discover Your Match</p>
          <h3 id="destination-match-modal-title" className="mt-1 text-xl font-bold text-slate-900">
            Find your perfect Himalayan destination
          </h3>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="cursor-hover rounded-full p-1 text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <X size={20} />
        </button>
      </div>

      {status === 'success' ? (
        <div className="mt-5 space-y-4">
          {results.length === 0 ? (
            <p className="text-sm text-slate-600">No matches found — try adjusting your preferences.</p>
          ) : (
            <ul className="space-y-3">
              {results.map(({ destination, score }) => (
                <li key={destination.slug}>
                  <Link
                    href={`/destinations/${destination.slug}`}
                    onClick={handleClose}
                    className="cursor-hover group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all duration-300 ease-in-out hover:border-apex-400/50 hover:bg-apex-50"
                  >
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <SafeImage src={destination.image} alt={destination.title} fill sizes="64px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{destination.title}</span>
                      {destination.region ? <span className="block text-xs text-slate-500">{destination.region}</span> : null}
                    </span>
                    <span className="shrink-0 rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold text-white">{score}% match</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="cursor-hover w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {SLIDERS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm">
                <label htmlFor={`match-${key}`} className="font-medium text-slate-700">
                  {label}
                </label>
                <span className="text-slate-500">{preferences[key]}</span>
              </div>
              <input
                id={`match-${key}`}
                type="range"
                min="0"
                max="100"
                value={preferences[key]}
                onChange={(event) => setPreferences((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-apex-500"
              />
            </div>
          ))}

          {status === 'error' ? <p className="text-sm text-red-500">Something went wrong — please try again.</p> : null}

          <button
            type="button"
            onClick={handleFindMatch}
            disabled={status === 'loading'}
            className="cursor-hover flex w-full items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? 'Finding your match…' : 'Find My Match'}
          </button>
        </div>
      )}
    </FloatingOverlay>
  );
}
