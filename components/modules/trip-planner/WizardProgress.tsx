'use client';

import { Check } from 'lucide-react';
import { WIZARD_STEP_LABELS } from '@/config/tripPlanner.config';
import { cn } from '@/lib/utils';

export interface WizardProgressProps {
  currentStep: number;
  /**
   * Lets a visitor jump back to a step they've already completed (or reselect the
   * active one). Nodes for steps ahead of `currentStep` are always rendered disabled,
   * so this can never be used to skip past the wizard's own forward-validation gate —
   * only the parent's existing back/forward logic ever advances the step.
   */
  onStepClick?: (step: number) => void;
}

export function WizardProgress({ currentStep, onStepClick }: WizardProgressProps) {
  const total = WIZARD_STEP_LABELS.length;

  // Percent-of-track math for the connecting line: node centers sit at the midpoint
  // of each step's equal-width column, so the track (and its fill) is inset by half a
  // column on each side rather than running full-bleed edge to edge.
  const trackInsetPercent = total > 0 ? 50 / total : 0;
  const trackWidthPercent = 100 - 2 * trackInsetPercent;
  const progressFraction = total > 1 ? (currentStep - 1) / (total - 1) : 0;
  const fillWidthPercent = progressFraction * trackWidthPercent;

  return (
    <div>
      {/* Mobile: compact "Step X of N" bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Step {currentStep} of {total}
          </span>
          <span className="font-bold text-apex-600">{WIZARD_STEP_LABELS[currentStep - 1]}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-apex-500 transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: large numbered nodes on a filling progress line */}
      <ol className="relative hidden items-start sm:flex">
        <div
          className="absolute top-[22px] h-1 rounded-full bg-slate-200"
          style={{ left: `${trackInsetPercent}%`, width: `${trackWidthPercent}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[22px] h-1 rounded-full bg-apex-500 transition-all duration-300 ease-in-out"
          style={{ left: `${trackInsetPercent}%`, width: `${fillWidthPercent}%` }}
          aria-hidden="true"
        />

        {WIZARD_STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const done = stepNumber < currentStep;
          const active = stepNumber === currentStep;
          const reached = done || active;

          return (
            <li key={label} className="relative flex flex-1 flex-col items-center gap-2">
              <button
                type="button"
                disabled={!reached || !onStepClick}
                aria-current={active ? 'step' : undefined}
                aria-label={`${done ? 'Completed' : active ? 'Current' : 'Upcoming'} step ${stepNumber}: ${label}`}
                onClick={reached ? () => onStepClick?.(stepNumber) : undefined}
                className={cn(
                  'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ease-in-out disabled:cursor-not-allowed',
                  active && 'scale-110 bg-apex-500 text-white shadow-lg shadow-apex-500/40',
                  done && 'cursor-hover bg-apex-100 text-apex-700 hover:bg-apex-200',
                  !active && !done && 'border border-slate-300 bg-slate-200 text-slate-400'
                )}
              >
                {done ? <Check size={18} strokeWidth={3} /> : String(stepNumber).padStart(2, '0')}
              </button>
              <span
                className={cn(
                  'hidden truncate text-xs transition-colors duration-300 ease-in-out lg:block',
                  active && 'font-bold text-apex-600',
                  done && 'font-semibold text-apex-500',
                  !active && !done && 'font-semibold text-slate-500'
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
