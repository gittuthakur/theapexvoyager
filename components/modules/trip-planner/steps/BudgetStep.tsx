'use client';

import { BUDGET_BRACKETS, BUDGET_MODES } from '@/config/tripPlanner.config';
import { cn } from '@/lib/utils';
import type { WizardBudgetState } from '@/types/tripPlanner';

export interface BudgetStepProps {
  value: WizardBudgetState;
  onChange: (value: WizardBudgetState) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

const MAX_NOTES_LENGTH = 500;

export function BudgetStep({ value, onChange, notes, onNotesChange }: BudgetStepProps) {
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Budget mode" className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
        {BUDGET_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={value.mode === mode.id}
            onClick={() => onChange({ ...value, mode: mode.id })}
            className={cn(
              'cursor-hover rounded-full px-4 py-2 text-sm font-semibold transition',
              value.mode === mode.id ? 'bg-apex-500 text-white' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">Select your budget bracket</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUDGET_BRACKETS.map((bracket) => {
            const selected = value.bracketId === bracket.id;
            return (
              <button
                key={bracket.id}
                type="button"
                onClick={() => onChange({ ...value, bracketId: bracket.id })}
                aria-pressed={selected}
                className={cn(
                  'cursor-hover flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-300 ease-in-out',
                  selected ? 'border-apex-400 bg-apex-50 shadow-md' : 'border-slate-200 bg-white hover:border-apex-400/50'
                )}
              >
                <span className="text-sm font-semibold text-slate-900">{bracket.label}</span>
                <span className="text-xs text-slate-500">{bracket.range}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="planner-notes" className="text-sm font-semibold text-slate-900">
          Anything else we should know? (optional)
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Tell us about dietary needs, accessibility requirements, celebrations, preferred pickup points or anything else that may help us plan
          better.
        </p>
        <textarea
          id="planner-notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value.slice(0, MAX_NOTES_LENGTH))}
          maxLength={MAX_NOTES_LENGTH}
          rows={3}
          placeholder="e.g., vegetarian meals only, celebrating an anniversary, need a wheelchair-accessible stay"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-apex-400"
        />
      </div>
    </div>
  );
}
