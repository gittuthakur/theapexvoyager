'use client';

import { TRAVEL_STYLES } from '@/config/tripPlanner.config';
import { SelectCard } from '../SelectCard';
import type { TravelStyleId } from '@/types/tripPlanner';

export interface TravelStyleStepProps {
  value: TravelStyleId[];
  onChange: (value: TravelStyleId[]) => void;
}

export function TravelStyleStep({ value, onChange }: TravelStyleStepProps) {
  function toggle(id: TravelStyleId) {
    onChange(value.includes(id) ? value.filter((existing) => existing !== id) : [...value, id]);
  }

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">What kind of trip are you looking for?</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {TRAVEL_STYLES.map((style) => (
          <SelectCard key={style.id} label={style.label} icon={style.icon} selected={value.includes(style.id)} onClick={() => toggle(style.id)} />
        ))}
      </div>
    </fieldset>
  );
}
