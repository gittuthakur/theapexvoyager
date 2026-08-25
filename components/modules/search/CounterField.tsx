'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Minus, Plus, Users, type LucideIcon } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { SEARCH_FIELD_CLASS } from './panelStyles';

export interface StepperRowProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** A single labeled +/- stepper row — shared by OccupancyField (one row per traveler type) and CounterField (a single row for a plain count). */
export function StepperRow({ label, description, value, min, max, onChange }: StepperRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="cursor-hover flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors duration-300 ease-in-out hover:border-apex-400/60 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="cursor-hover flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors duration-300 ease-in-out hover:border-apex-400/60 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export interface CounterFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: LucideIcon;
  stepperLabel?: string;
  stepperDescription?: string;
}

/** A single-count field (Passengers, Participants) — same trigger/popover shape as OccupancyField, but for one number instead of a full traveler breakdown. */
export function CounterField({
  label,
  value,
  onChange,
  min = 1,
  max = 20,
  icon: Icon = Users,
  stepperLabel = label,
  stepperDescription
}: CounterFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div ref={anchorRef} className="relative">
      <label className={SEARCH_FIELD_CLASS}>
        <Icon size={18} className="shrink-0 text-apex-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="cursor-hover w-full truncate bg-transparent text-left text-sm text-slate-900 outline-none"
          >
            {value} {stepperLabel}
            {value === 1 ? '' : 's'}
          </button>
        </span>
        <ChevronDown size={16} className="shrink-0 text-slate-400" />
      </label>

      <FieldPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={280} className="z-50">
        <StepperRow label={stepperLabel} description={stepperDescription} value={value} min={min} max={max} onChange={onChange} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-hover mt-2 w-full rounded-full bg-apex-500 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          Done
        </button>
      </FieldPopover>
    </div>
  );
}
