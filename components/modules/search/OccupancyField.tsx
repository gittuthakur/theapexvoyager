'use client';

import { useRef, useState } from 'react';
import { PawPrint, Users } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { StepperRow } from './CounterField';
import { SEARCH_FIELD_CLASS } from './panelStyles';
import { ServiceAnimalModal } from '@/components/modules/ServiceAnimalModal';
import { cn } from '@/lib/utils';
import type { OccupancyDetails } from '@/types';

export interface OccupancyFieldProps {
  value: OccupancyDetails;
  onChange: (value: OccupancyDetails) => void;
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
  const [serviceAnimalModalOpen, setServiceAnimalModalOpen] = useState(false);

  function patch(next: Partial<OccupancyDetails>) {
    onChange({ ...value, ...next });
  }

  return (
    <div ref={anchorRef} className="relative">
      <label className={SEARCH_FIELD_CLASS}>
        <Users size={18} className="shrink-0 text-apex-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Travelers</span>
          <button type="button" onClick={() => setOpen(true)} className="cursor-hover w-full truncate bg-transparent text-left text-sm text-slate-900 outline-none">
            {summarizeOccupancy(value)}
          </button>
        </span>
      </label>

      <FieldPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={320} align="right" className="z-50">
        <p className="px-1 text-sm font-semibold text-slate-900">Travelers</p>
        <div className="mt-1 divide-y divide-slate-200">
          <StepperRow
            label="Adults"
            description="Ages 13 or above"
            value={value.adults}
            min={1}
            max={16}
            onChange={(next) => patch({ adults: next })}
          />
          <StepperRow
            label="Children"
            description="Ages 0-12"
            value={value.children}
            min={0}
            max={10}
            onChange={(next) => patch({ children: next })}
          />
          <StepperRow
            label="Rooms"
            description="For stay bookings"
            value={value.rooms}
            min={1}
            max={8}
            onChange={(next) => patch({ rooms: next })}
          />
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-slate-200 pt-4">
          <div className="flex items-start gap-2.5">
            <PawPrint size={18} className="mt-0.5 shrink-0 text-apex-300" />
            <div>
              <p className="text-sm font-medium text-slate-900">Traveling with pets?</p>
              <p className="mt-1 max-w-[200px] text-xs text-slate-500">
                Assistance animals aren&apos;t considered pets.{' '}
                <button
                  type="button"
                  onClick={() => setServiceAnimalModalOpen(true)}
                  className="cursor-hover underline transition-colors duration-300 ease-in-out hover:text-apex-300"
                >
                  Read more about traveling with assistance animals
                </button>
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
              'cursor-hover relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out',
              value.pets ? 'bg-apex-500' : 'bg-slate-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out',
                value.pets ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-hover mt-4 w-full rounded-full bg-apex-500 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          Done
        </button>
      </FieldPopover>

      <ServiceAnimalModal open={serviceAnimalModalOpen} onClose={() => setServiceAnimalModalOpen(false)} />
    </div>
  );
}
