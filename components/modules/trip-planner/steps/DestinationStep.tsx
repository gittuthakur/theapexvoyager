'use client';

import { useMemo, useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { SelectCard } from '../SelectCard';
import { PLANNER_POPULAR_PLACES, PLANNER_REGIONS } from '@/config/tripPlanner.config';
import type { WizardDestinationState } from '@/types/tripPlanner';

export interface DestinationStepProps {
  value: WizardDestinationState;
  onChange: (value: WizardDestinationState) => void;
}

export function DestinationStep({ value, onChange }: DestinationStepProps) {
  const [query, setQuery] = useState('');

  function toggleRegion(id: string) {
    const next = value.regionIds.includes(id) ? value.regionIds.filter((regionId) => regionId !== id) : [...value.regionIds, id];
    onChange({ ...value, regionIds: next });
  }

  function addPlace(place: string) {
    const trimmed = place.trim();
    if (!trimmed || value.places.includes(trimmed)) return;
    onChange({ ...value, places: [...value.places, trimmed] });
    setQuery('');
  }

  function removePlace(place: string) {
    onChange({ ...value, places: value.places.filter((existing) => existing !== place) });
  }

  const suggestions = useMemo(() => {
    const available = PLANNER_POPULAR_PLACES.filter((place) => !value.places.includes(place));
    if (!query) return available.slice(0, 8);
    return available.filter((place) => place.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, value.places]);

  return (
    <div className="space-y-8">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-0 w-full p-0 text-sm font-semibold text-slate-900">Choose one or more regions</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PLANNER_REGIONS.map((region) => (
            <SelectCard
              key={region.id}
              label={region.name}
              description={region.description}
              icon={region.icon}
              selected={value.regionIds.includes(region.id)}
              onClick={() => toggleRegion(region.id)}
            />
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="planner-destination-search" className="text-sm font-semibold text-slate-900">
          Add specific valleys or towns (optional)
        </label>
        <div className="relative mt-3">
          <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-apex-500" />
          <input
            id="planner-destination-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addPlace(query);
              }
            }}
            placeholder="e.g., Manali, Spiti, Dharamshala, Shimla"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-11 text-sm text-slate-900 outline-none transition focus:border-apex-400"
          />
        </div>

        {suggestions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((place) => (
              <button
                key={place}
                type="button"
                onClick={() => addPlace(place)}
                className="cursor-hover flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 ease-in-out hover:border-apex-400/60 hover:text-slate-900"
              >
                <Plus size={12} /> {place}
              </button>
            ))}
          </div>
        ) : null}

        {value.places.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {value.places.map((place) => (
              <span key={place} className="flex items-center gap-1.5 rounded-full bg-apex-500 px-3.5 py-1.5 text-xs font-semibold text-white">
                {place}
                <button
                  type="button"
                  onClick={() => removePlace(place)}
                  aria-label={`Remove ${place}`}
                  className="cursor-hover rounded-full transition-colors duration-300 ease-in-out hover:bg-white/20"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
