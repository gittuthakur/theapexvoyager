'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface FieldPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  width?: number;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Renders into document.body via a portal, fixed-positioned against the anchor field's
 * live bounding box. BookingWidget sits inside HeroSection, whose root has
 * overflow-hidden (needed to clip the full-bleed background image) — a normal
 * absolutely-positioned dropdown nested inside it would get clipped the moment it
 * grew taller than the remaining hero space below. Portaling to body sidesteps that
 * entirely, the same way Airbnb/Booking.com-style widgets do.
 */
export function FieldPopover({ open, onClose, anchorRef, children, width, align = 'left', className }: FieldPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelWidth = width ?? rect.width;
      const rawLeft = align === 'right' ? rect.right - panelWidth : rect.left;
      const left = Math.max(16, Math.min(rawLeft, window.innerWidth - panelWidth - 16));
      setCoords({ top: rect.bottom + 8, left, minWidth: rect.width });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorRef, width, align]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !coords || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: coords.top, left: coords.left, minWidth: coords.minWidth, zIndex: 100 }}
      className={cn(
        'max-h-[80vh] max-w-[95vw] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-glow backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}
