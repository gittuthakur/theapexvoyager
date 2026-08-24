import type { ReactNode } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterListOptionProps {
  href: string;
  active: boolean;
  children: ReactNode;
  /** 'checkbox' (square, check glyph) matches the Destinations sidebar's real
   *  checkbox control (components/modules/destinations/FilterAccordion.tsx) exactly.
   *  'radio' (circle, filled dot) is the same visual language for a single-select
   *  axis Destinations has no existing control for — same colors/spacing/typography,
   *  just a circular indicator instead of a square one. */
  variant?: 'checkbox' | 'radio';
}

/**
 * A Link-based option row styled identically to Destinations' `FilterCheckbox`, for
 * filter panels (like Stays') that are pure URL/server-driven navigation rather than
 * client checkbox state — clicking still just navigates via the caller's existing
 * href-building logic, nothing here talks to any filter/query logic itself.
 */
export default function FilterListOption({ href, active, children, variant = 'checkbox' }: FilterListOptionProps) {
  const isRadio = variant === 'radio';
  return (
    <Link
      href={href}
      role={isRadio ? 'radio' : 'checkbox'}
      aria-checked={active}
      className="cursor-hover group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors duration-300 ease-in-out hover:bg-slate-50"
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors duration-300 ease-in-out',
          isRadio ? 'rounded-full' : 'rounded-[5px]',
          active ? 'border-apex-500 bg-apex-500' : 'border-slate-300 bg-white group-hover:border-apex-300'
        )}
      >
        {active ? (
          isRadio ? <span className="h-2 w-2 rounded-full bg-white" /> : <Check size={11} strokeWidth={3} className="text-white" />
        ) : null}
      </span>
      <span className="text-sm leading-tight text-slate-700">{children}</span>
    </Link>
  );
}
