'use client';

import { BUDGET_BRACKETS, BUDGET_MODES } from '@/config/tripPlanner.config';
import { cn } from '@/lib/utils';
import type { WizardBudgetState } from '@/types/tripPlanner';

export interface BudgetStepProps {
  value: WizardBudgetState;
  onChange: (value: WizardBudgetState) => void;
}

export function BudgetStep({ value, onChange }: BudgetStepProps) {
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
    </div>
  );
}
