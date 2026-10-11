'use client';

import { useMemo, useRef, useState } from 'react';
import { MapPin, type LucideIcon } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { SEARCH_FIELD_CLASS } from './panelStyles';
import { regionCategories, trendingDestinations } from '@/config/search.config';

export interface DestinationFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  destinations?: string[];
  label?: string;
  icon?: LucideIcon;
}

export function DestinationField({
  value,
  onChange,
  placeholder = 'e.g., Manali, Spiti, Dharamshala, Shimla',
  destinations = trendingDestinations,
  label = 'Destination',
  icon: Icon = MapPin
}: DestinationFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // `touched` = the visitor has typed since this popover opened. Until then the suggestion list
  // is the full, unfiltered list even though the input shows the committed value — otherwise
  // reopening a field holding "Manali" would hide every destination except Manali.
  const [touched, setTouched] = useState(false);

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase();
    if (!touched || !needle) return destinations;
    // Exact match first, then "starts with", then any other substring match — so
    // searching "Spiti" surfaces "Spiti Valley" ahead of an unrelated place that merely
    // contains the letters "spiti" somewhere in the middle of its name.
    const rank = (name: string) => {
      const lower = name.toLowerCase();
      if (lower === needle) return 0;
      if (lower.startsWith(needle)) return 1;
      return 2;
    };
    return destinations.filter((name) => name.toLowerCase().includes(needle)).sort((a, b) => rank(a) - rank(b));
  }, [destinations, value, touched]);

  function selectDestination(name: string) {
    onChange(name);
    setTouched(false);
    setOpen(false);
  }

  // Typed text is committed to the parent on every keystroke (see onChange below), so closing
  // without picking a suggestion (click-outside, Escape) has nothing left to commit — the
  // free-text entry for a place not in `destinations` is already the field's value.
  function close() {
    setOpen(false);
    setTouched(false);
  }

  return (
    <div ref={anchorRef} className="relative">
      <label className={SEARCH_FIELD_CLASS}>
        <Icon size={24} className="shrink-0 text-apex-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <input
            value={value}
            // Deliberately not onFocus: FieldPopover restores focus to this input
            // whenever the popover closes for *any* reason (picking an option
            // included, since the clicked option unmounts and focus would
            // otherwise fall through to nowhere) — opening on focus would make
            // that restoration immediately reopen the dropdown it just closed.
            onClick={(event) => {
              setOpen(true);
              // Show the committed value and select it, so typing replaces it and
              // Backspace clears it — instead of an empty-looking field that silently
              // still holds the old destination.
              event.currentTarget.select();
            }}
            onKeyDown={(event) => {
              if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
                event.preventDefault();
                setOpen(true);
              }
            }}
            onChange={(event) => {
              setTouched(true);
              setOpen(true);
              // Commit every keystroke to the parent. The typed text used to live only in local
              // state and reach the parent when the popover closed, so pressing Enter with the
              // popover still open submitted a stale or empty destination. Emptying the input
              // now clears the committed value as well.
              onChange(event.target.value);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
          />
        </span>
      </label>

      <FieldPopover open={open} onClose={close} anchorRef={anchorRef} width={360} className="z-50">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Quick select regions</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {regionCategories.map((region) => {
            const RegionIcon = region.icon;
            return (
              <button
                key={region.name}
                type="button"
                onClick={() => selectDestination(region.name)}
                className="cursor-hover flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center transition-all duration-300 ease-in-out hover:border-apex-400/60 hover:bg-apex-50 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-apex-50 text-apex-500">
                  <RegionIcon size={20} />
                </span>
                <span className="text-xs font-semibold text-slate-900">{region.name}</span>
                <span className="text-[10px] leading-snug text-slate-500">{region.description}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Trending destinations</p>
        <ul className="mt-2 max-h-72 space-y-0.5">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => selectDestination(name)}
                className="cursor-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
              >
                <MapPin size={16} className="shrink-0 text-apex-300" />
                {name}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="px-3 py-2.5 text-sm text-slate-500">No destinations match &ldquo;{value}&rdquo;</li> : null}
        </ul>
      </FieldPopover>
    </div>
  );
}
