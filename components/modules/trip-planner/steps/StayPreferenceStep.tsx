'use client';

import { STAY_AMENITIES, STAY_BUDGET_RANGE, STAY_TYPE_OPTIONS } from '@/config/tripPlanner.config';
import { formatINR } from '@/lib/pricing';
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
      <div>
        <p className="text-sm font-semibold text-slate-900">What kind of stay do you prefer?</p>
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
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">Budget per night</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Minimum</span>
              <span className="font-semibold text-slate-900">{formatINR(value.minBudgetPerNight)}</span>
            </div>
            <input
              type="range"
              min={STAY_BUDGET_RANGE.min}
              max={STAY_BUDGET_RANGE.max}
              step={STAY_BUDGET_RANGE.step}
              value={value.minBudgetPerNight}
              onChange={(event) =>
                onChange({ ...value, minBudgetPerNight: Math.min(Number(event.target.value), value.maxBudgetPerNight - STAY_BUDGET_RANGE.step) })
              }
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-apex-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Maximum</span>
              <span className="font-semibold text-slate-900">{formatINR(value.maxBudgetPerNight)}</span>
            </div>
            <input
              type="range"
              min={STAY_BUDGET_RANGE.min}
              max={STAY_BUDGET_RANGE.max}
              step={STAY_BUDGET_RANGE.step}
              value={value.maxBudgetPerNight}
              onChange={(event) =>
                onChange({ ...value, maxBudgetPerNight: Math.max(Number(event.target.value), value.minBudgetPerNight + STAY_BUDGET_RANGE.step) })
              }
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-apex-500"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">Amenities you&apos;d love</p>
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
      </div>
    </div>
  );
}
