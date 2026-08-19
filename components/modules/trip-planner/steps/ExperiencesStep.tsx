'use client';

import { EXPERIENCE_OPTIONS } from '@/config/tripPlanner.config';
import { SelectCard } from '../SelectCard';
import type { ExperienceId } from '@/types/tripPlanner';

export interface ExperiencesStepProps {
  value: ExperienceId[];
  onChange: (value: ExperienceId[]) => void;
}

export function ExperiencesStep({ value, onChange }: ExperiencesStepProps) {
  function toggle(id: ExperienceId) {
    onChange(value.includes(id) ? value.filter((existing) => existing !== id) : [...value, id]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {EXPERIENCE_OPTIONS.map((experience) => (
        <SelectCard
          key={experience.id}
          label={experience.label}
          description={experience.description}
          icon={experience.icon}
          selected={value.includes(experience.id)}
          onClick={() => toggle(experience.id)}
        />
      ))}
    </div>
  );
}
