'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { ChoiceCard } from './ChoiceCard';
import { BUDGET_BRACKETS, PLANNER_REGIONS } from '@/config/tripPlanner.config';
import { priceJourney } from '@/lib/tripPlannerPricing';
import type { JourneyChoice, JourneyParams, JourneyTierId, TripPlannerWizardState } from '@/types/tripPlanner';

export interface ResultsViewProps {
  state: TripPlannerWizardState;
  choices: JourneyChoice[];
  onEditAnswers: () => void;
}

function destinationsLabel(state: TripPlannerWizardState) {
  const regionNames = state.destination.regionIds.map((id) => PLANNER_REGIONS.find((region) => region.id === id)?.name ?? id);
  const combined = [...regionNames, ...state.destination.places];
  return combined.length > 0 ? combined.join(', ') : 'Anywhere in the Himalayas';
}

function datesLabel(state: TripPlannerWizardState) {
  if (state.dates.start && state.dates.end) {
    const format = (date: Date) => date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${format(state.dates.start)} – ${format(state.dates.end)}${state.dates.flexible ? ' (flexible ±3 days)' : ''}`;
  }
  return state.dates.flexible ? 'Flexible dates' : 'Dates to be confirmed';
}

function travellersLabel(state: TripPlannerWizardState) {
  const { adults, children, rooms } = state.travellers;
  const parts = [`${adults} Adult${adults === 1 ? '' : 's'}`];
  if (children > 0) parts.push(`${children} Child${children === 1 ? '' : 'ren'}`);
  parts.push(`${rooms} Room${rooms === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

function budgetLabel(state: TripPlannerWizardState) {
  const bracket = BUDGET_BRACKETS.find((option) => option.id === state.budget.bracketId);
  if (!bracket) return 'Not specified';
  return `${bracket.range} (${state.budget.mode === 'total' ? 'total trip' : 'per person'})`;
}

export function ResultsView({ state, choices, onEditAnswers }: ResultsViewProps) {
  const [overrides, setOverrides] = useState<Partial<Record<JourneyTierId, JourneyParams>>>({});

  const travellerCount = Math.max(1, state.travellers.adults + state.travellers.children);
  const bracket = BUDGET_BRACKETS.find((option) => option.id === state.budget.bracketId);

  const priced = useMemo(
    () =>
      choices.map((choice) => {
        const params = overrides[choice.id] ?? choice.params;
        return { ...choice, params, price: priceJourney(params) };
      }),
    [choices, overrides]
  );

  const recommendedId = useMemo(() => {
    if (priced.length === 0) return undefined;
    if (!bracket) return priced[0].id;
    const target = state.budget.mode === 'total' ? (bracket.min + bracket.max) / 2 : ((bracket.min + bracket.max) / 2) * travellerCount;
    return priced.reduce((best, choice) => (Math.abs(choice.price.total - target) < Math.abs(best.price.total - target) ? choice : best), priced[0])
      .id;
  }, [bracket, priced, state.budget.mode, travellerCount]);

  function updateParams(id: JourneyTierId, next: JourneyParams) {
    setOverrides((prev) => ({ ...prev, [id]: next }));
  }

  const journeyContext = {
    destinations: destinationsLabel(state),
    dates: datesLabel(state),
    travelers: travellersLabel(state),
    budget: budgetLabel(state),
    notes: state.notes.trim() || undefined
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16">
      <button
        type="button"
        onClick={onEditAnswers}
        className="cursor-hover inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Edit my answers
      </button>

      <div className="mt-4 flex items-center gap-2 text-apex-600">
        <Sparkles size={18} />
        <p className="text-sm font-semibold uppercase tracking-[0.28em]">Curated for you</p>
      </div>
      <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Your Himalayan Journey</h2>
      <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
        {journeyContext.destinations} · {journeyContext.dates} · {journeyContext.travelers}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {priced.map((choice, index) => (
          <ChoiceCard
            key={choice.id}
            rank={index + 1}
            choice={choice}
            recommended={choice.id === recommendedId}
            onParamsChange={(next) => updateParams(choice.id, next)}
            journeyContext={journeyContext}
          />
        ))}
      </div>
    </div>
  );
}
