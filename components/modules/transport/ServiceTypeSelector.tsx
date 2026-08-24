'use client';

import { Bike, Car, KeyRound, MountainSnow, Navigation, Users2, type LucideIcon } from 'lucide-react';
import { SERVICE_TYPE_UI, type ServiceType } from '@/config/transportServiceTypes.config';
import { cn } from '@/lib/utils';

const SERVICE_TYPE_ICONS: Record<ServiceType, LucideIcon> = {
  'Cab with Driver': Car,
  'Local Taxi': Car,
  'Group Transport': Users2,
  '4x4 / Mountain Vehicle': MountainSnow,
  'Self-Drive Car': KeyRound,
  'Bike / Motorcycle': Bike,
  'Local Mobility': Navigation
};

export interface ServiceTypeSelectorProps {
  value: ServiceType;
  onChange: (value: ServiceType) => void;
}

/** The "How do you want to travel?" first decision — always visible (not behind a
 *  popover, unlike the field-level pickers below it) and horizontally scrollable on
 *  narrow screens so it never forces the hero form to grow taller. */
export default function ServiceTypeSelector({ value, onChange }: ServiceTypeSelectorProps) {
  return (
    <div className="w-full">
      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">How do you want to travel?</p>
      <div className="mt-2 flex gap-2 pb-1">
        {SERVICE_TYPE_UI.map((entry) => {
          const Icon = SERVICE_TYPE_ICONS[entry.value];
          const active = value === entry.value;
          return (
            <button
              key={entry.value}
              type="button"
              onClick={() => onChange(entry.value)}
              className={cn(
                'cursor-hover flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out',
                active
                  ? 'border-apex-500 bg-apex-500 text-white shadow-lg shadow-apex-500/30'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700'
              )}
            >
              <Icon size={14} className={active ? 'text-white' : 'text-apex-400'} />
              {entry.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
