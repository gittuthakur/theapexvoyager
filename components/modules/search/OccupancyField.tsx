'use client';

import { useRef, useState } from 'react';
import { Minus, PawPrint, Plus, Users } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { cn } from '@/lib/utils';
import type { OccupancyDetails } from '@/types';

export interface OccupancyFieldProps {
  value: OccupancyDetails;
  onChange: (value: OccupancyDetails) => void;
}

interface StepperRowProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function StepperRow({ label, description, value, min, max, onChange }: StepperRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="cursor-hover flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:border-apex-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-white">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="cursor-hover flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:border-apex-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function summarizeOccupancy(value: OccupancyDetails) {
  const parts = [
    `${value.adults} Adult${value.adults === 1 ? '' : 's'}`,
    `${value.children} Child${value.children === 1 ? '' : 'ren'}`
  ];
  if (value.pets) parts.push('Pets');
  parts.push(`${value.rooms} Room${value.rooms === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export function OccupancyField({ value, onChange }: OccupancyFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function patch(next: Partial<OccupancyDetails>) {
    onChange({ ...value, ...next });
  }

  return (
    <div ref={anchorRef} className="relative">
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-apex-400/60">
        <Users size={18} className="shrink-0 text-apex-300" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Occupancy</span>
          <button type="button" onClick={() => setOpen(true)} className="cursor-hover w-full truncate bg-transparent text-left text-sm text-white outline-none">
            {summarizeOccupancy(value)}
          </button>
        </span>
      </label>

      <FieldPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={320} align="right">
        <div className="divide-y divide-white/10">
          <StepperRow label="Adults" value={value.adults} min={1} max={16} onChange={(next) => patch({ adults: next })} />
          <StepperRow
            label="Children"
            description="Ages 0-17"
            value={value.children}
            min={0}
            max={10}
            onChange={(next) => patch({ children: next })}
          />
          <StepperRow label="Rooms" value={value.rooms} min={1} max={8} onChange={(next) => patch({ rooms: next })} />
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
          <div className="flex items-start gap-2.5">
            <PawPrint size={16} className="mt-0.5 shrink-0 text-apex-300" />
            <div>
              <p className="text-sm font-medium text-white">Traveling with pets?</p>
              <p className="mt-1 max-w-[200px] text-xs text-slate-500">
                Assistance animals aren&apos;t considered pets.{' '}
                <a href="/policies/assistance-animals" className="cursor-hover underline transition hover:text-apex-300">
                  Read more about traveling with assistance animals
                </a>
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value.pets}
            aria-label="Traveling with pets"
            onClick={() => patch({ pets: !value.pets })}
            className={cn(
              'cursor-hover relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
              value.pets ? 'bg-apex-500' : 'bg-white/10'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition',
                value.pets ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-hover mt-4 w-full rounded-full bg-apex-500 py-2.5 text-sm font-semibold text-white transition hover:bg-apex-400"
        >
          Done
        </button>
      </FieldPopover>
    </div>
  );
}
