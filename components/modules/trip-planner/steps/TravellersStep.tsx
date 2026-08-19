'use client';

import { StepperRow } from '@/components/modules/search/CounterField';
import { COMPANION_TYPES } from '@/config/tripPlanner.config';
import { SelectCard } from '../SelectCard';
import type { WizardTravellersState } from '@/types/tripPlanner';

export interface TravellersStepProps {
  value: WizardTravellersState;
  onChange: (value: WizardTravellersState) => void;
}

export function TravellersStep({ value, onChange }: TravellersStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-slate-900">Who&apos;s travelling?</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COMPANION_TYPES.map((companion) => (
            <SelectCard
              key={companion.id}
              label={companion.label}
              description={companion.description}
              icon={companion.icon}
              selected={value.companionType === companion.id}
              onClick={() => onChange({ ...value, companionType: companion.id })}
            />
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5">
        <StepperRow
          label="Adults"
          description="Ages 13 or above"
          value={value.adults}
          min={1}
          max={16}
          onChange={(adults) => onChange({ ...value, adults })}
        />
        <StepperRow
          label="Children"
          description="Ages 0-12"
          value={value.children}
          min={0}
          max={10}
          onChange={(children) => onChange({ ...value, children })}
        />
        <StepperRow
          label="Rooms"
          description="How many rooms you'll need"
          value={value.rooms}
          min={1}
          max={8}
          onChange={(rooms) => onChange({ ...value, rooms })}
        />
      </div>
    </div>
  );
}
