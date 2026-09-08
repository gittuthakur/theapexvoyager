'use client';

import { STAY_AMENITIES, STAY_TYPE_OPTIONS } from '@/config/tripPlanner.config';
import { cn } from '@/lib/utils';
import { SelectCard } from '../SelectCard';
import type { StayTypeId, WizardStayState } from '@/types/tripPlanner';

export interface StayPreferenceStepProps {
  value: WizardStayState;
  onChange: (value: WizardStayState) => void;
}

export function StayPreferenceStep({ value, onChange }: StayPreferenceStepProps) {
  function toggleType(id: StayTypeId) {
    onChange({
      ...value,
      typeIds: value.typeIds.includes(id) ? value.typeIds.filter((existing) => existing !== id) : [...value.typeIds, id]
    });
  }

  function toggleAmenity(amenity: string) {
    onChange({
      ...value,
      amenities: value.amenities.includes(amenity) ? value.amenities.filter((existing) => existing !== amenity) : [...value.amenities, amenity]
    });
  }

  return (
    <div className="space-y-8">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-0 w-full p-0 text-sm font-semibold text-slate-900">What kind of stay do you prefer?</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STAY_TYPE_OPTIONS.map((stay) => (
            <SelectCard
              key={stay.id}
              label={stay.label}
              icon={stay.icon}
              selected={value.typeIds.includes(stay.id)}
              onClick={() => toggleType(stay.id)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-0 w-full p-0 text-sm font-semibold text-slate-900">Amenities you&apos;d love</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAY_AMENITIES.map((amenity) => {
            const selected = value.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                aria-pressed={selected}
                className={cn(
                  'cursor-hover rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-in-out',
                  selected ? 'border-apex-500 bg-apex-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-apex-400/50'
                )}
              >
                {amenity}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
