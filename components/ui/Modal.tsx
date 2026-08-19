'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <FloatingOverlay
      open={open}
      onClose={onClose}
      label={title}
      panelClassName={cn(
        'flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-glow',
        className
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-4">
        {title ? <h3 className="text-xl font-semibold text-slate-900">{title}</h3> : <span />}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="cursor-hover rounded-full bg-slate-100 p-2 text-slate-600 transition-colors duration-300 ease-in-out hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="pointer-events-auto mt-6 min-h-0 flex-1 overflow-y-auto"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </FloatingOverlay>
  );
}
