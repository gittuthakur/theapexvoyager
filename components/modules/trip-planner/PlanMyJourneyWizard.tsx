'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Info, X } from 'lucide-react';
import { registerBottomOverlay } from '@/lib/bottomOverlay';
import { WizardProgress } from './WizardProgress';
import { StepHeader } from './StepHeader';
import { ResultsView } from './ResultsView';
import { DestinationStep } from './steps/DestinationStep';
import { DatesStep } from './steps/DatesStep';
import { TravellersStep } from './steps/TravellersStep';
import { TravelStyleStep } from './steps/TravelStyleStep';
import { StayPreferenceStep } from './steps/StayPreferenceStep';
import { ExperiencesStep } from './steps/ExperiencesStep';
import { TransportStep } from './steps/TransportStep';
import { BudgetStep } from './steps/BudgetStep';
import { mapBookingContextToWizardState } from './bookingContextToWizardState';
import { WIZARD_STEP_LABELS, getPlannerRegionId } from '@/config/tripPlanner.config';
import { computeJourneyChoices } from '@/lib/tripPlannerPricing';
import { destinations } from '@/config/destinations.config';
import type { TripPlannerWizardState } from '@/types/tripPlanner';
import type { BookingContext } from '@/types/bookingContext';

const TOTAL_STEPS = WIZARD_STEP_LABELS.length;

const DEFAULT_STATE: TripPlannerWizardState = {
  destination: { regionIds: [], places: [] },
  dates: { start: null, end: null, flexible: false },
  travellers: { companionType: 'couple', adults: 2, children: 0, rooms: 1 },
  travelStyleIds: [],
  stay: { typeIds: [], minBudgetPerNight: 2000, maxBudgetPerNight: 8000, amenities: [] },
  experienceIds: [],
  transport: { modeId: null, pickup: '', drop: '' },
  budget: { mode: 'total', bracketId: null }
};

// A CTA anywhere on the site can link here with ?source=<journey|destination|stay|
// experience|transport>&slug=<slug> (see lib/bookingNavigation.ts) — resolved
// server-side into `bookingContext` (app/plan-my-journey/page.tsx) and mapped onto the
// full wizard state. It takes priority over the older, narrower ?destination=<slug> /
// ?region=<regionId> params (still supported below for existing region-page/legacy
// links), which only ever prefill the destination step.
function buildInitialState(
  bookingContext: BookingContext | null,
  destinationSlug: string | null,
  regionId: string | null
): TripPlannerWizardState {
  if (bookingContext) return mapBookingContextToWizardState(bookingContext, DEFAULT_STATE);
  if (destinationSlug) {
    const destination = destinations.find((entry) => entry.slug === destinationSlug);
    if (destination) return { ...DEFAULT_STATE, destination: { regionIds: [], places: [destination.title] } };
  }
  if (regionId) {
    const plannerRegionId = getPlannerRegionId(regionId);
    if (plannerRegionId) return { ...DEFAULT_STATE, destination: { regionIds: [plannerRegionId], places: [] } };
  }
  return DEFAULT_STATE;
}

function contextKey(context: BookingContext | null): string | null {
  return context ? `${context.source}:${context.slug}` : null;
}

const STEP_SUBTITLES: Record<number, string> = {
  1: 'Pick the regions and specific valleys or towns you want to explore.',
  2: 'When are you planning to travel?',
  3: 'Tell us who is coming along.',
  4: 'What kind of trip are you looking for? Pick as many as you like.',
  5: 'What should your nights away feel like?',
  6: 'What do you want to actually do while you are there?',
  7: 'How should we move you between destinations?',
  8: 'One last thing — what should we plan around?'
};

export interface PlanMyJourneyWizardProps {
  bookingContext?: BookingContext | null;
  /** True whenever the URL carried a `source`/`slug` pair at all, even one that failed
   *  to resolve — drives the invalid-slug notice below (never shown for a bare visit
   *  or a legacy destination=/region= link). */
  hadBookingParams?: boolean;
}

export default function PlanMyJourneyWizard({ bookingContext = null, hadBookingParams = false }: PlanMyJourneyWizardProps) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<TripPlannerWizardState>(() =>
    buildInitialState(bookingContext, searchParams.get('destination'), searchParams.get('region'))
  );
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<'wizard' | 'results'>('wizard');
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const appliedContextKey = useRef<string | null>(contextKey(bookingContext));

  // Re-initializes only when the resolved item actually changes (a fresh source+slug
  // navigation, including a client-side one that doesn't remount this component) —
  // never on an unrelated re-render, so answers the traveler has already edited are
  // never clobbered. A full replace (not a merge) is what makes switching from one
  // booked item to another discard the previous selection instead of layering on it.
  useEffect(() => {
    const nextKey = contextKey(bookingContext);
    if (nextKey === appliedContextKey.current) return;
    appliedContextKey.current = nextKey;
    setNoticeDismissed(false);
    if (!bookingContext) return;
    setState(mapBookingContextToWizardState(bookingContext, DEFAULT_STATE));
    setStep(1);
    setPhase('wizard');
  }, [bookingContext]);

  const showInvalidBookingNotice = hadBookingParams && !bookingContext && !noticeDismissed && step === 1 && phase === 'wizard';

  const choices = useMemo(() => (phase === 'results' ? computeJourneyChoices(state) : []), [phase, state]);

  const canProceed = step !== 1 || state.destination.regionIds.length > 0 || state.destination.places.length > 0;

  function goNext() {
    if (!canProceed) return;
    if (step === TOTAL_STEPS) {
      setPhase('results');
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  // Clicking a stepper node only ever moves backward to an already-reached step —
  // clamped defensively even though WizardProgress itself only renders reached nodes
  // as clickable, so the forward-validation gate in goNext() can never be bypassed.
  function goToStep(target: number) {
    setStep((current) => Math.min(current, Math.max(1, target)));
  }

  // The sticky mobile nav bar below (`sm:hidden`) occupies the same bottom-right
  // real estate as the global Back-to-Top button — claim that space only while it's
  // actually visible (mobile viewport, wizard phase) so Back-to-Top yields to it.
  useEffect(() => {
    if (phase !== 'wizard') return;
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    let unregister: (() => void) | null = null;

    function sync() {
      if (mediaQuery.matches && !unregister) {
        unregister = registerBottomOverlay();
      } else if (!mediaQuery.matches && unregister) {
        unregister();
        unregister = null;
      }
    }

    sync();
    mediaQuery.addEventListener('change', sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
      unregister?.();
    };
  }, [phase]);

  if (phase === 'results') {
    return <ResultsView state={state} choices={choices} onEditAnswers={() => setPhase('wizard')} />;
  }

  return (
    <div className="py-8">
      <div className="">
        <WizardProgress currentStep={step} onStepClick={goToStep} />

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          {showInvalidBookingNotice ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p className="flex-1">We couldn&apos;t find what you were booking, so we&apos;ve started a fresh plan for you.</p>
              <button
                type="button"
                onClick={() => setNoticeDismissed(true)}
                aria-label="Dismiss"
                className="cursor-hover shrink-0 text-amber-600 transition-colors duration-300 ease-in-out hover:text-amber-900"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <StepHeader index={step} total={TOTAL_STEPS} title={WIZARD_STEP_LABELS[step - 1]} subtitle={STEP_SUBTITLES[step]} />

          <div className="mt-8">
            {step === 1 ? (
              <DestinationStep value={state.destination} onChange={(destination) => setState((current) => ({ ...current, destination }))} />
            ) : null}
            {step === 2 ? <DatesStep value={state.dates} onChange={(dates) => setState((current) => ({ ...current, dates }))} /> : null}
            {step === 3 ? (
              <TravellersStep value={state.travellers} onChange={(travellers) => setState((current) => ({ ...current, travellers }))} />
            ) : null}
            {step === 4 ? (
              <TravelStyleStep
                value={state.travelStyleIds}
                onChange={(travelStyleIds) => setState((current) => ({ ...current, travelStyleIds }))}
              />
            ) : null}
            {step === 5 ? <StayPreferenceStep value={state.stay} onChange={(stay) => setState((current) => ({ ...current, stay }))} /> : null}
            {step === 6 ? (
              <ExperiencesStep value={state.experienceIds} onChange={(experienceIds) => setState((current) => ({ ...current, experienceIds }))} />
            ) : null}
            {step === 7 ? (
              <TransportStep value={state.transport} onChange={(transport) => setState((current) => ({ ...current, transport }))} />
            ) : null}
            {step === 8 ? <BudgetStep value={state.budget} onChange={(budget) => setState((current) => ({ ...current, budget }))} /> : null}
          </div>

          {/* Desktop navigation */}
          <div className="mt-10 hidden items-center justify-between border-t border-slate-200 pt-6 sm:flex">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="cursor-hover inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === TOTAL_STEPS ? 'Build My Journey' : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky mobile navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="cursor-hover flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canProceed}
          className="cursor-hover flex-1 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step === TOTAL_STEPS ? 'Build My Journey' : 'Next'}
        </button>
      </div>
    </div>
  );
}
