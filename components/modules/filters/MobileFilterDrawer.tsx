'use client';

import { useRef, useState, type ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FieldPopover } from '@/components/modules/search/FieldPopover';
import { filterTriggerClass } from './filterStyles';

export interface MobileFilterDrawerProps {
  activeFilterCount: number;
  /** The filter panel's own body content (sections/pills/etc.) — rendered as-is
   *  inside the drawer, same content the desktop sidebar shows. */
  children: ReactNode;
  /** Optional footer row (e.g. a "Clear" action, an "Apply"/"Show N results" button)
   *  — left entirely to the caller since not every filter panel batches selections
   *  before applying them. */
  footer?: ReactNode;
  triggerLabel?: string;
  panelTitle?: string;
  /** Extra content rendered in the same row as the trigger (e.g. a view toggle). */
  trailing?: ReactNode;
}

/**
 * The shared "Filters button → drawer → dismiss" mobile pattern, generalized from
 * DestinationsExplorer's own inline implementation (components/modules/DestinationsExplorer.tsx)
 * so other filter panels (Stays, and eventually Journeys/Experiences) can reuse the same
 * interaction without a new modal/drawer library — it's still just FieldPopover, the
 * existing portal-based popover every search field already uses.
 */
export default function MobileFilterDrawer({
  activeFilterCount,
  children,
  footer,
  triggerLabel = 'Filter by',
  panelTitle = 'Filter by',
  trailing
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center justify-between gap-2 xl:hidden">
      <div ref={anchorRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={filterTriggerClass(activeFilterCount > 0)}
        >
          <SlidersHorizontal size={16} />
          {triggerLabel}
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-apex-600">
              {activeFilterCount}
            </span>
          ) : null}
        </button>

        <FieldPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={340} align="left" className="z-50">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-slate-900">{panelTitle}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="cursor-hover text-slate-400 transition-colors duration-300 ease-in-out hover:text-slate-900"
            >
              <X size={16} />
            </button>
          </div>
          <div className="px-1">{children}</div>
          {footer ? <div className="mt-5 flex items-center justify-between border-t border-slate-100 px-1 pt-4">{footer}</div> : null}
        </FieldPopover>
      </div>

      {trailing}
    </div>
  );
}
