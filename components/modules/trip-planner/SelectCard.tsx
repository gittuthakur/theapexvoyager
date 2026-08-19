'use client';

import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectCardProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

/** Shared multi/single-select tile used by every wizard step that presents a catalog of cards to pick from (regions, companions, travel styles, stay types, experiences, transport modes). */
export function SelectCard({ label, description, icon: Icon, selected, onClick }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'cursor-hover group relative flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-300 ease-in-out',
        selected ? 'border-apex-400 bg-apex-50 shadow-md' : 'border-slate-200 bg-white hover:border-apex-400/50 hover:bg-apex-50/40'
      )}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-apex-500 text-white">
          <Check size={12} />
        </span>
      ) : null}
      {Icon ? (
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ease-in-out',
            selected ? 'bg-apex-500 text-white' : 'bg-apex-50 text-apex-600'
          )}
        >
          <Icon size={20} />
        </span>
      ) : null}
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {description ? <span className="text-xs leading-5 text-slate-500">{description}</span> : null}
    </button>
  );
}
