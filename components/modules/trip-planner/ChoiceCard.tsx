'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { CustomizePanel } from './CustomizePanel';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { EXPERIENCE_OPTIONS, STAY_TYPE_OPTIONS, TRANSPORT_MODES } from '@/config/tripPlanner.config';
import { formatINR } from '@/lib/pricing';
import { buildJourneyRequestMessage } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import type { JourneyChoice, JourneyParams } from '@/types/tripPlanner';

export interface JourneyContext {
  destinations: string;
  dates: string;
  travelers: string;
  budget: string;
}

export interface ChoiceCardProps {
  rank: number;
  choice: JourneyChoice;
  recommended: boolean;
  onParamsChange: (params: JourneyParams) => void;
  journeyContext: JourneyContext;
}

export function ChoiceCard({ rank, choice, recommended, onParamsChange, journeyContext }: ChoiceCardProps) {
  const [customizing, setCustomizing] = useState(false);
  const { openBookingRequest } = useBookingRequest();

  function handleRequest() {
    const stayLabel = STAY_TYPE_OPTIONS.find((option) => option.id === choice.params.stayTypeId)?.label ?? choice.params.stayTypeId;
    const transportLabel = TRANSPORT_MODES.find((option) => option.id === choice.params.transportModeId)?.label ?? choice.params.transportModeId;
    const experiences =
      choice.params.experienceIds.map((id) => EXPERIENCE_OPTIONS.find((option) => option.id === id)?.label ?? id).join(', ') ||
      'None selected';

    openBookingRequest({
      type: 'journey',
      itemName: `${choice.title} — ${journeyContext.destinations}`,
      destination: journeyContext.destinations,
      dates: journeyContext.dates,
      travelers: journeyContext.travelers,
      details: {
        source: 'trip-planner',
        tier: choice.id,
        params: choice.params,
        breakdown: choice.price.breakdown,
        total: choice.price.total
      },
      buildWhatsAppMessage: (referenceId) =>
        buildJourneyRequestMessage({
          referenceId,
          tierTitle: choice.title,
          destinations: journeyContext.destinations,
          dates: journeyContext.dates,
          travelers: journeyContext.travelers,
          stayLabel,
          transportLabel,
          experiences,
          budgetLabel: journeyContext.budget,
          estimatedTotal: formatINR(choice.price.total),
          perPerson: formatINR(choice.price.perPerson)
        })
    });
  }

  return (
    <article
      className={cn(
        'flex flex-col rounded-[2rem] border bg-white p-6 shadow-glow transition-all duration-300 ease-in-out',
        recommended ? 'border-apex-400 ring-2 ring-apex-400/30' : 'border-slate-200'
      )}
    >
      {recommended ? (
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-apex-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          <Sparkles size={12} /> Best match for your budget
        </span>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-apex-600">
        {String(rank).padStart(2, '0')} — {choice.title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{choice.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {choice.highlights.map((highlight) => (
          <span key={highlight} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {highlight}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-slate-200 pt-5">
        {choice.price.breakdown.map((line) => (
          <div key={line.label} className="flex items-center justify-between text-sm text-slate-600">
            <span>{line.label}</span>
            <span>{formatINR(line.amount)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-semibold text-slate-900">Estimated total</span>
        <span className="text-2xl font-bold text-slate-900">{formatINR(choice.price.total)}</span>
      </div>
      <p className="text-right text-xs text-slate-500">{formatINR(choice.price.perPerson)} per person</p>

      <button
        type="button"
        onClick={() => setCustomizing((current) => !current)}
        aria-expanded={customizing}
        className="cursor-hover mt-5 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-100"
      >
        Customize this Journey
        {customizing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {customizing ? (
        <div className="mt-4">
          <CustomizePanel params={choice.params} onChange={onParamsChange} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleRequest}
        className="cursor-hover mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-apex-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
      >
        Request This Journey
      </button>
    </article>
  );
}
