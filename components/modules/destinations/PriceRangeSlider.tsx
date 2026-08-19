'use client';

import { useEffect, useMemo, useState } from 'react';
import './PriceRangeSlider.css';

export interface PriceRangeSliderProps {
  /** Real `startingPrice` values only (see lib/destinationFilters.ts's getRealStartingPrices) — never fabricated. */
  prices: number[];
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function formatDigits(amount: number): string {
  return Math.round(amount).toLocaleString('en-IN');
}

function parseDigits(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

export default function PriceRangeSlider({ prices, value, onChange }: PriceRangeSliderProps) {
  const bounds = useMemo(() => {
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [prices]);

  const [selectedMin, selectedMax] = value;

  // Free-typed text for the Min/Max fields, kept separate from `value` so a user mid-keystroke
  // (e.g. clearing the field to retype) never gets overwritten by a reformatted prop update.
  // Only re-synced from `value` while the field isn't focused — see the effects below.
  const [minText, setMinText] = useState(() => formatDigits(selectedMin));
  const [maxText, setMaxText] = useState(() => formatDigits(selectedMax));
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  useEffect(() => {
    if (!minFocused) setMinText(formatDigits(selectedMin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMin, minFocused]);
  useEffect(() => {
    if (!maxFocused) setMaxText(formatDigits(selectedMax));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMax, maxFocused]);

  // Fewer than 2 distinct real prices means there's nothing meaningful to slide
  // between — an honest empty state instead of faking a range around one number.
  if (!bounds || bounds.min === bounds.max) {
    return <p className="text-sm text-slate-500">Pricing isn&apos;t available for enough destinations yet to filter by price.</p>;
  }

  function commitMin() {
    const parsed = parseDigits(minText);
    const next = parsed === null ? bounds!.min : Math.min(Math.max(parsed, bounds!.min), selectedMax);
    onChange([next, selectedMax]);
    setMinText(formatDigits(next));
  }

  function commitMax() {
    const parsed = parseDigits(maxText);
    const next = parsed === null ? bounds!.max : Math.max(Math.min(parsed, bounds!.max), selectedMin);
    onChange([selectedMin, next]);
    setMaxText(formatDigits(next));
  }

  const span = bounds.max - bounds.min;
  const minPct = ((selectedMin - bounds.min) / span) * 100;
  const maxPct = ((selectedMax - bounds.min) / span) * 100;

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Min</span>
          <span className="flex items-center rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-2 transition focus-within:border-apex-400 focus-within:bg-white">
            <span className="text-sm text-slate-400">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={minText}
              onFocus={() => setMinFocused(true)}
              onChange={(event) => setMinText(event.target.value.replace(/[^\d]/g, ''))}
              onBlur={() => {
                setMinFocused(false);
                commitMin();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
              aria-label="Minimum price"
              className="w-full min-w-0 bg-transparent py-2 pl-1 text-sm font-semibold text-slate-900 outline-none"
            />
          </span>
        </label>
        <span className="mt-4 text-slate-300">—</span>
        <label className="flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Max</span>
          <span className="flex items-center rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-2 transition focus-within:border-apex-400 focus-within:bg-white">
            <span className="text-sm text-slate-400">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={maxText}
              onFocus={() => setMaxFocused(true)}
              onChange={(event) => setMaxText(event.target.value.replace(/[^\d]/g, ''))}
              onBlur={() => {
                setMaxFocused(false);
                commitMax();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
              aria-label="Maximum price"
              className="w-full min-w-0 bg-transparent py-2 pl-1 text-sm font-semibold text-slate-900 outline-none"
            />
          </span>
        </label>
      </div>

      <div className="price-range-slider mt-5">
        <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-apex-500"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={selectedMin}
          onChange={(event) => onChange([Math.min(Number(event.target.value), selectedMax), selectedMax])}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={selectedMax}
          onChange={(event) => onChange([selectedMin, Math.max(Number(event.target.value), selectedMin)])}
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}
