'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './PriceMaxSlider.css';

export interface PriceMaxSliderProps {
  /** Real minimum/maximum nightly price across the current result set — never
   *  fabricated, mirrors components/modules/destinations/PriceRangeSlider.tsx's own
   *  "real bounds only" rule. */
  min: number;
  max: number;
  /** Current priceMax, or undefined for "no ceiling" (renders at the slider's max). */
  value?: number;
  /** Builds the destination href for a given priceMax value (or undefined to clear it) — the
   *  caller owns all URL/param logic; this component only decides WHEN to navigate. */
  buildHref: (priceMax: number | undefined) => string;
}

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * A single-handle "price per night, up to X" slider — visually the same thumb/track
 * language as Destinations' PriceRangeSlider, but honestly single-ended: Stays'
 * filtering only ever supported one ceiling value (`priceMax`), never a true min+max
 * range, so this doesn't pretend otherwise. Dragging updates local state instantly for
 * a smooth feel; the actual navigation (still the existing `priceMax` URL param,
 * exactly as before) only commits once the drag/keypress settles, avoiding a
 * navigation per pixel of drag.
 */
export default function PriceMaxSlider({ min, max, value, buildHref }: PriceMaxSliderProps) {
  const router = useRouter();
  // `value` comes straight from a URL query param — an invalid/hand-edited one
  // (`?priceMax=abc` or `?priceMax=-100`) parses to NaN or a negative number, neither
  // of which `??` catches (only null/undefined). A negative ceiling is never a real
  // price any more than NaN is, so both are treated the same as "no ceiling" — parked
  // at the slider's own max, never fed to the range input as an out-of-domain value.
  const effectiveValue = value !== undefined && Number.isFinite(value) && value >= 0 ? value : max;
  const [liveValue, setLiveValue] = useState(effectiveValue);

  useEffect(() => setLiveValue(effectiveValue), [effectiveValue]);

  if (max <= min) {
    return <p className="text-sm text-slate-500">Pricing isn&apos;t available for enough stays yet to filter by price.</p>;
  }

  function commit(next: number) {
    // Snapping to the real max means "no ceiling" — clear the param entirely rather
    // than sending an explicit priceMax equal to the real maximum, matching the
    // existing "Any price" semantics exactly.
    router.push(buildHref(next >= max ? undefined : next));
  }

  const pct = ((liveValue - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Up to</span>
        <span className="text-sm font-semibold text-slate-900">{liveValue >= max ? 'Any price' : formatINR(liveValue)}</span>
      </div>
      <div className="price-max-slider mt-3">
        <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-200" />
        <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-apex-500" style={{ right: `${100 - pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={liveValue}
          onChange={(event) => setLiveValue(Number(event.target.value))}
          onMouseUp={(event) => commit(Number(event.currentTarget.value))}
          onTouchEnd={(event) => commit(Number(event.currentTarget.value))}
          onKeyUp={(event) => commit(Number(event.currentTarget.value))}
          aria-label="Maximum price per night"
        />
      </div>
    </div>
  );
}
