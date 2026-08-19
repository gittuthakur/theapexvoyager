'use client';

import { useState } from 'react';
import { addMonths, format, isBefore, startOfDay, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthGrid } from '@/components/modules/search/MonthGrid';
import { cn } from '@/lib/utils';
import type { WizardDatesState } from '@/types/tripPlanner';

export interface DatesStepProps {
  value: WizardDatesState;
  onChange: (value: WizardDatesState) => void;
}

export function DatesStep({ value, onChange }: DatesStepProps) {
  const [leftMonth, setLeftMonth] = useState(() => startOfMonth(value.start ?? new Date()));
  const today = startOfDay(new Date());
  const rightMonth = addMonths(leftMonth, 1);

  function handleSelectDay(day: Date) {
    if (!value.start || (value.start && value.end)) {
      onChange({ ...value, start: day, end: null });
      return;
    }
    if (isBefore(day, value.start)) {
      onChange({ ...value, start: day, end: value.start });
    } else {
      onChange({ ...value, end: day });
    }
  }

  const summary =
    value.start && value.end
      ? `${format(value.start, 'MMM d')} – ${format(value.end, 'MMM d, yyyy')}`
      : value.start
        ? `${format(value.start, 'MMM d')} – add your return date`
        : 'Pick your travel dates below';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected dates</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{summary}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.flexible}
          onClick={() => onChange({ ...value, flexible: !value.flexible })}
          className="cursor-hover flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 ease-in-out hover:border-apex-400/50"
        >
          Flexible by ±3 days
          <span
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
              value.flexible ? 'bg-apex-500' : 'bg-slate-200'
            )}
          >
            <span
              className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition', value.flexible ? 'translate-x-6' : 'translate-x-1')}
            />
          </span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setLeftMonth((month) => addMonths(month, -1))}
            className="cursor-hover rounded-full p-1.5 text-slate-600 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-slate-500">Select check-in, then check-out</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setLeftMonth((month) => addMonths(month, 1))}
            className="cursor-hover rounded-full p-1.5 text-slate-600 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-3 grid gap-8 sm:grid-cols-2">
          <MonthGrid month={leftMonth} range={{ checkIn: value.start, checkOut: value.end }} onSelectDay={handleSelectDay} minDate={today} />
          <div className="hidden sm:block">
            <MonthGrid month={rightMonth} range={{ checkIn: value.start, checkOut: value.end }} onSelectDay={handleSelectDay} minDate={today} />
          </div>
        </div>

        {value.start || value.end ? (
          <button
            type="button"
            onClick={() => onChange({ ...value, start: null, end: null })}
            className="cursor-hover mt-4 text-sm font-medium text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
          >
            Clear dates
          </button>
        ) : null}
      </div>
    </div>
  );
}
