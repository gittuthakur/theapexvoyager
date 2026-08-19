'use client';

import { Minus, Plus } from 'lucide-react';
import { STAY_TYPE_OPTIONS, TRANSPORT_MODES } from '@/config/tripPlanner.config';
import { cn } from '@/lib/utils';
import type { JourneyParams, StayTypeId, TransportModeId } from '@/types/tripPlanner';

export interface CustomizePanelProps {
  params: JourneyParams;
  onChange: (params: JourneyParams) => void;
}

/** Lets a visitor swap a tier's stay type, transport mode, or nights and see the price recalculate instantly — the pricing engine (lib/tripPlannerPricing.ts) is re-run by the parent card on every change here, so this component only ever mutates JourneyParams. */
export function CustomizePanel({ params, onChange }: CustomizePanelProps) {
  function setStay(stayTypeId: StayTypeId) {
    onChange({ ...params, stayTypeId });
  }
  function setTransport(transportModeId: TransportModeId) {
    onChange({ ...params, transportModeId });
  }
  function setNights(nights: number) {
    onChange({ ...params, nights: Math.max(1, nights) });
  }

  return (
    <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stay type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAY_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStay(option.id)}
              aria-pressed={params.stayTypeId === option.id}
              className={cn(
                'cursor-hover rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-in-out',
                params.stayTypeId === option.id
                  ? 'border-apex-500 bg-apex-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-apex-400/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transport</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRANSPORT_MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTransport(option.id)}
              aria-pressed={params.transportModeId === option.id}
              className={cn(
                'cursor-hover rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-in-out',
                params.transportModeId === option.id
                  ? 'border-apex-500 bg-apex-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-apex-400/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nights</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease nights"
            disabled={params.nights <= 1}
            onClick={() => setNights(params.nights - 1)}
            className="cursor-hover flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors duration-300 ease-in-out hover:border-apex-400/60 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-slate-900">{params.nights}</span>
          <button
            type="button"
            aria-label="Increase nights"
            onClick={() => setNights(params.nights + 1)}
            className="cursor-hover flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors duration-300 ease-in-out hover:border-apex-400/60 hover:text-slate-900"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
