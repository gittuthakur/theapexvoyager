'use client';

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/types';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface MonthGridProps {
  month: Date;
  range: DateRange;
  onSelectDay: (day: Date) => void;
  minDate?: Date;
}

export function MonthGrid({ month, range, onSelectDay, minDate }: MonthGridProps) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="w-full">
      <p className="text-center text-sm font-semibold text-slate-900">{format(month, 'MMMM yyyy')}</p>
      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[11px] text-slate-500">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const disabled = Boolean(minDate && isBefore(day, startOfDay(minDate)));
          const isStart = Boolean(range.checkIn && isSameDay(day, range.checkIn));
          const isEnd = Boolean(range.checkOut && isSameDay(day, range.checkOut));
          const inRange =
            range.checkIn && range.checkOut && isWithinInterval(day, { start: range.checkIn, end: range.checkOut });

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!inMonth || disabled}
              onClick={() => onSelectDay(day)}
              className={cn(
                'cursor-hover mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs transition-colors duration-300 ease-in-out',
                !inMonth && 'pointer-events-none opacity-0',
                inMonth && disabled && 'cursor-not-allowed text-slate-300',
                inMonth && !disabled && !inRange && !isStart && !isEnd && 'text-slate-700 hover:bg-slate-100',
                inMonth && inRange && !isStart && !isEnd && 'rounded-none bg-apex-50 text-slate-900',
                (isStart || isEnd) && 'bg-apex-500 text-white'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
