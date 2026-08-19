'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
import { WIZARD_STEP_LABELS } from '@/config/tripPlanner.config';
import { computeJourneyChoices } from '@/lib/tripPlannerPricing';
import type { TripPlannerWizardState } from '@/types/tripPlanner';

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

export default function PlanMyJourneyWizard() {
  const [state, setState] = useState<TripPlannerWizardState>(DEFAULT_STATE);
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<'wizard' | 'results'>('wizard');

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

  if (phase === 'results') {
    return <ResultsView state={state} choices={choices} onEditAnswers={() => setPhase('wizard')} />;
  }

  return (
    <div className="pb-28 sm:pb-0">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-14">
        <WizardProgress currentStep={step} onStepClick={goToStep} />

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
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
