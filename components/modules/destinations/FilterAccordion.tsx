'use client';

import { useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterAccordionProps {
  title: string;
  /** Count of currently-active selections within this section, shown as a small badge. */
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function FilterAccordion({ title, count = 0, defaultOpen = true, children }: FilterAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="cursor-hover flex w-full items-center justify-between text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          {title}
          {count > 0 ? <span className="rounded-full bg-apex-50 px-1.5 py-0.5 text-[11px] font-bold text-apex-600">{count}</span> : null}
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-slate-400 transition-transform duration-300 ease-in-out', open && 'rotate-180')} />
      </button>
      {open ? <div className="mt-3 grid grid-cols-2 gap-1">{children}</div> : null}
    </div>
  );
}

export interface FilterCheckboxProps {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}

export function FilterCheckbox({ checked, onChange, children }: FilterCheckboxProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors duration-300 ease-in-out hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-300 ease-in-out',
          checked ? 'border-apex-500 bg-apex-500' : 'border-slate-300 bg-white group-hover:border-apex-300'
        )}
      >
        {checked ? <Check size={11} strokeWidth={3} className="text-white" /> : null}
      </span>
      <span className="text-sm leading-tight text-slate-700">{children}</span>
    </label>
  );
}
