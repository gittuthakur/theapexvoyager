import { WizardProgress } from './WizardProgress';
import { StepHeader } from './StepHeader';
import { WIZARD_STEP_LABELS } from '@/config/tripPlanner.config';

const REGION_CARD_COUNT = 3; // matches PLANNER_REGIONS.length (config/tripPlanner.config.ts)
const SUGGESTION_CHIP_COUNT = 4;

/**
 * The Suspense boundary around PlanMyJourneyWizard (app/plan-my-journey/page.tsx) is
 * required because the wizard reads useSearchParams() — not optional, and not a data
 * fetch we can otherwise avoid. A `fallback={null}` there reserved zero height for what
 * is normally a 500px+ tall card, so the Footer sat directly under the page's intro text
 * until hydration replaced the fallback with the real wizard, producing a ~0.6 CLS jump
 * (measured: PERFORMANCE P2R/P2S). This mirrors the real step-1 shell — the same
 * WizardProgress/StepHeader components, and the same grid/padding/border classes
 * DestinationStep's region cards and search input use — so the reserved space comes from
 * the same layout primitives production renders, not a guessed pixel height.
 */
export function WizardSkeleton() {
  return (
    <div className="py-8" aria-hidden="true">
      <div>
        <WizardProgress currentStep={1} />

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <StepHeader
            index={1}
            total={WIZARD_STEP_LABELS.length}
            title={WIZARD_STEP_LABELS[0]}
            subtitle="Pick the regions and specific valleys or towns you want to explore."
          />

          <div className="mt-8 space-y-8">
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: REGION_CARD_COUNT }).map((_, index) => (
                <div key={index} className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>

            <div>
              <div className="h-4 w-64 max-w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-11">
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: SUGGESTION_CHIP_COUNT }).map((_, index) => (
                  <div key={index} className="h-[26px] w-24 animate-pulse rounded-full border border-slate-200 bg-white" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 hidden items-center justify-between border-t border-slate-200 pt-6 sm:flex">
            <div className="h-11 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-11 w-32 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
