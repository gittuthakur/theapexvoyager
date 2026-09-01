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
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return destinations;
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
  }, [destinations, query]);

  function selectDestination(name: string) {
    onChange(name);
    setQuery('');
    setOpen(false);
  }

  // Closing without picking a suggestion (blur, click-outside, Escape) must still
  // commit whatever the visitor typed — otherwise free-text entry for a place not
  // in `destinations` silently vanishes instead of becoming the field's value.
  function close() {
    setOpen(false);
    const typed = query.trim();
    if (typed && typed !== value) {
      onChange(typed);
    }
    setQuery('');
  }

  return (
    <div ref={anchorRef} className="relative">
      <label className={SEARCH_FIELD_CLASS}>
        <Icon size={24} className="shrink-0 text-apex-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <input
            value={open ? query : value}
            // Deliberately not onFocus: FieldPopover restores focus to this input
            // whenever the popover closes for *any* reason (picking an option
            // included, since the clicked option unmounts and focus would
            // otherwise fall through to nowhere) — opening on focus would make
            // that restoration immediately reopen the dropdown it just closed.
            onClick={() => setOpen(true)}
            onKeyDown={(event) => {
              if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
                event.preventDefault();
                setOpen(true);
              }
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
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
          {filtered.length === 0 ? <li className="px-3 py-2.5 text-sm text-slate-500">No destinations match &ldquo;{query}&rdquo;</li> : null}
        </ul>
      </FieldPopover>
    </div>
  );
}
