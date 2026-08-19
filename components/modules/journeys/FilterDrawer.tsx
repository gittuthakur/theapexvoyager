'use client';

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  resultCount: number;
  onClear: () => void;
}

/**
 * Right-side drawer on desktop, full-height bottom sheet on mobile — built on the
 * shared FloatingOverlay primitive (see components/ui/Modal.tsx for the centered
 * variant) rather than a new overlay/portal/scroll-lock implementation.
 */
export default function FilterDrawer({ open, onClose, children, resultCount, onClear }: FilterDrawerProps) {
  return (
    <FloatingOverlay
      open={open}
      onClose={onClose}
      label="Filter journeys"
      overlayClassName="items-end justify-center p-0 sm:items-stretch sm:justify-end"
      panelClassName="flex w-full max-w-none flex-col border border-slate-200 bg-white sm:h-[100% + 24px] sm:max-w-md -m-4 sm:-m-6"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-bold text-slate-900">Filter by</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="cursor-hover rounded-full bg-slate-100 p-2 text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" onWheel={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()}>
        {children}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        <button
          type="button"
          onClick={onClear}
          className="cursor-hover text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-hover rounded-xl bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-apex-400"
        >
          Show {resultCount} Journey{resultCount === 1 ? '' : 's'}
        </button>
      </div>
    </FloatingOverlay>
  );
}
