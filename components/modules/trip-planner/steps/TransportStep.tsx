'use client';

import { TRANSPORT_MODES } from '@/config/tripPlanner.config';
import { SelectCard } from '../SelectCard';
import type { WizardTransportState } from '@/types/tripPlanner';

export interface TransportStepProps {
  value: WizardTransportState;
  onChange: (value: WizardTransportState) => void;
}

const inputStyles =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-apex-400';

export function TransportStep({ value, onChange }: TransportStepProps) {
  return (
    <div className="space-y-8">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-0 w-full p-0 text-sm font-semibold text-slate-900">How would you like to get around?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TRANSPORT_MODES.map((mode) => (
            <SelectCard
              key={mode.id}
              label={mode.label}
              description={mode.description}
              icon={mode.icon}
              selected={value.modeId === mode.id}
              onClick={() => onChange({ ...value, modeId: mode.id })}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planner-pickup" className="mb-2 block text-sm font-semibold text-slate-900">
            Pickup Location
          </label>
          <input
            id="planner-pickup"
            value={value.pickup}
            onChange={(event) => onChange({ ...value, pickup: event.target.value })}
            placeholder="Chandigarh Airport"
            className={inputStyles}
          />
        </div>
        <div>
          <label htmlFor="planner-drop" className="mb-2 block text-sm font-semibold text-slate-900">
            Drop Location
          </label>
          <input
            id="planner-drop"
            value={value.drop}
            onChange={(event) => onChange({ ...value, drop: event.target.value })}
            placeholder="Manali"
            className={inputStyles}
          />
        </div>
      </div>
    </div>
  );
}
