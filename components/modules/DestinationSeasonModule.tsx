'use client';

import { useState } from 'react';
import { Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DestinationSeasonModuleProps {
  destinationTitle: string;
  seasons: string[];
  seasonalNotes?: Record<string, string>;
}

export default function DestinationSeasonModule({ destinationTitle, seasons, seasonalNotes }: DestinationSeasonModuleProps) {
  const [activeSeason, setActiveSeason] = useState(seasons[0]);
  const note = seasonalNotes?.[activeSeason];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {seasons.map((season) => (
          <button
            key={season}
            type="button"
            onClick={() => setActiveSeason(season)}
            className={cn(
              'cursor-hover rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out',
              activeSeason === season ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            )}
          >
            {season}
          </button>
        ))}
      </div>

      {note ? (
        <div className="mt-5 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apex-50 text-apex-500">
            <Sun size={18} />
          </span>
          <p className="text-base leading-7 text-slate-600">{note}</p>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">{destinationTitle} is a good visit in {activeSeason.toLowerCase()} — check the At a Glance section above for the fuller picture.</p>
      )}
    </div>
  );
}
