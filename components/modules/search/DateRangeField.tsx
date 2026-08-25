'use client';

import { useRef, useState } from 'react';
import { addMonths, format, isBefore, startOfDay, startOfMonth } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { MonthGrid } from './MonthGrid';
import { SEARCH_FIELD_CLASS } from './panelStyles';
import { flexDateWindows, flexTripLengths } from '@/config/search.config';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/types';

export interface DateRangeFieldProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  placeholder?: string;
}

export function formatRange(range: DateRange) {
  if (range.checkIn && range.checkOut) {
    return `${format(range.checkIn, 'MMM d')} – ${format(range.checkOut, 'MMM d, yyyy')}`;
  }
  if (range.checkIn) {
    return `${format(range.checkIn, 'MMM d')} – Add checkout`;
  }
  return '';
}

export function DateRangeField({
  value,
  onChange,
  label = 'Check In - Check Out',
  placeholder = 'Select Travel Dates'
}: DateRangeFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'calendar' | 'flexible'>('calendar');
  const [leftMonth, setLeftMonth] = useState(() => startOfMonth(new Date()));
  const [flexWindow, setFlexWindow] = useState(flexDateWindows[0]);
  const [flexLength, setFlexLength] = useState(flexTripLengths[0]);

  const today = startOfDay(new Date());
  const rightMonth = addMonths(leftMonth, 1);

  function handleSelectDay(day: Date) {
    if (!value.checkIn || (value.checkIn && value.checkOut)) {
      onChange({ checkIn: day, checkOut: null });
      return;
    }
    if (isBefore(day, value.checkIn)) {
      onChange({ checkIn: day, checkOut: value.checkIn });
    } else {
      onChange({ checkIn: value.checkIn, checkOut: day });
    }
  }

  function clear() {
    onChange({ checkIn: null, checkOut: null });
  }

  const summary = formatRange(value);

  return (
    <div ref={anchorRef} className="relative">
      <label className={SEARCH_FIELD_CLASS}>
        <Calendar size={18} className="shrink-0 text-apex-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="cursor-hover w-full truncate bg-transparent text-left text-sm text-slate-900 outline-none"
          >
            {summary || <span className="text-slate-500">{placeholder}</span>}
          </button>
        </span>
      </label>

      <FieldPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={640}>
        <div role="tablist" aria-label="Date selection mode" className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
          {(['calendar', 'flexible'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'cursor-hover flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out',
                tab === key ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {key === 'calendar' ? 'Calendar' : "I'm flexible"}
            </button>
          ))}
        </div>

        {tab === 'calendar' ? (
          <>
            <div className="mt-4 flex items-center justify-between">
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

            <div className="mt-2 grid gap-6 sm:grid-cols-2">
              <MonthGrid month={leftMonth} range={value} onSelectDay={handleSelectDay} minDate={today} />
              <div className="hidden sm:block">
                <MonthGrid month={rightMonth} range={value} onSelectDay={handleSelectDay} minDate={today} />
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Flexible date options</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {flexDateWindows.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFlexWindow(option)}
                    className={cn(
                      'cursor-hover rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-in-out',
                      flexWindow === option ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
              <button type="button" onClick={clear} className="cursor-hover text-sm font-medium text-slate-500 hover:text-slate-900">
                Clear dates
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-hover rounded-full bg-apex-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trip length</p>
            <div className="mt-2 flex gap-2">
              {flexTripLengths.map((length) => (
                <button
                  key={length}
                  type="button"
                  onClick={() => setFlexLength(length)}
                  className={cn(
                    'cursor-hover flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out',
                    flexLength === length ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {length}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Go anytime in</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, index) => addMonths(today, index)).map((monthOption) => (
                <button
                  key={monthOption.toISOString()}
                  type="button"
                  onClick={() => setLeftMonth(startOfMonth(monthOption))}
                  className="cursor-hover rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors duration-300 ease-in-out hover:border-apex-400/60 hover:text-slate-900"
                >
                  {format(monthOption, 'MMM yyyy')}
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setTab('calendar')}
                className="cursor-hover rounded-full bg-apex-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                Show calendar
              </button>
            </div>
          </div>
        )}
      </FieldPopover>
    </div>
  );
}
