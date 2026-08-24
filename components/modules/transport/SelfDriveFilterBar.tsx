'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SelfDriveFilterBarProps {
  /** Real, derived from the currently-seeded self-drive fleet — never a fixed/fabricated list. */
  availableTransmissions: string[];
  /** Real seat counts present in the fleet, sorted ascending — rendered as "{n}+ seats". */
  availableSeatCounts: number[];
  transmission?: string;
  minSeats?: number;
  maxPrice?: number;
}

/**
 * Full-results-only refinement bar for Self-Drive (shown when service=self-drive is
 * the active search) — covers the 3 dimensions that have no Hero field at all
 * (transmission, seats, price). Vehicle category and pickup destination are already
 * Hero fields (TransportServiceFields' SelfDriveFields) and stay owned there; this bar
 * deliberately doesn't duplicate them. Reads/writes plain URL params directly rather
 * than going through TransportSearchContext, since these 3 fields have exactly one
 * reader (this page's server query) and one writer (this bar) — no Hero UI reflects
 * them, so there's nothing for them to drift out of sync with.
 */
export default function SelfDriveFilterBar({
  availableTransmissions,
  availableSeatCounts,
  transmission,
  minSeats,
  maxPrice
}: SelfDriveFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/transport?${qs}#transport-results` : '/transport', { scroll: false });
  }

  if (availableTransmissions.length === 0 && availableSeatCounts.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {availableTransmissions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transmission</span>
          {availableTransmissions.map((option) => {
            const active = transmission === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => updateParam('transmission', active ? '' : option)}
                className={cn(
                  'cursor-hover rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out',
                  active
                    ? 'border-apex-500 bg-apex-500 text-white shadow-lg shadow-apex-500/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700'
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}

      {availableSeatCounts.length > 0 ? (
        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Seats</span>
          <select
            value={minSeats ?? ''}
            onChange={(event) => updateParam('minSeats', event.target.value)}
            className="cursor-hover rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 outline-none transition-colors duration-300 ease-in-out hover:border-apex-400/50 focus:border-apex-400"
          >
            <option value="">Any</option>
            {availableSeatCounts.map((seats) => (
              <option key={seats} value={seats}>
                {seats}+ seats
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max price / day</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Any"
          defaultValue={maxPrice ?? ''}
          onBlur={(event) => updateParam('maxPrice', event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') updateParam('maxPrice', event.currentTarget.value);
          }}
          className="w-28 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors duration-300 ease-in-out hover:border-apex-400/50 focus:border-apex-400"
        />
      </label>
    </div>
  );
}
