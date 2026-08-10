'use client';

import { useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { trendingDestinations } from '@/config/search.config';

export interface DestinationFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  destinations?: string[];
}

export function DestinationField({
  value,
  onChange,
  placeholder = 'e.g., Manali, Spiti, Dharamshala, Shimla',
  destinations = trendingDestinations
}: DestinationFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return destinations;
    return destinations.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  }, [destinations, query]);

  function selectDestination(name: string) {
    onChange(name);
    setQuery('');
    setOpen(false);
  }

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={anchorRef} className="relative">
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-apex-400/60">
        <MapPin size={18} className="shrink-0 text-apex-300" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Destination</span>
          <input
            value={open ? query : value}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </span>
      </label>

      <FieldPopover open={open} onClose={close} anchorRef={anchorRef} width={320}>
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Trending destinations</p>
        <ul className="mt-2 max-h-72 space-y-0.5 overflow-y-auto">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => selectDestination(name)}
                className="cursor-hover flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5"
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
