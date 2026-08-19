'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { SEARCH_OVERLAY_CLASS } from './panelStyles';

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
 * live bounding box. GlobalSearchFilter sits inside HeroSection, whose root has
 * overflow-hidden (needed to clip the full-bleed background image) — a normal
 * absolutely-positioned dropdown nested inside it would get clipped the moment it
 * grew taller than the remaining hero space below. Portaling to body sidesteps that
 * entirely, the same way Airbnb/Booking.com-style widgets do.
 */
export function FieldPopover({ open, onClose, anchorRef, children, width, align = 'left', className }: FieldPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    minWidth: number;
    maxHeight: number;
  } | null>(null);

  useBodyScrollLock(open);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelWidth = width ?? rect.width;
      const rawLeft = align === 'right' ? rect.right - panelWidth : rect.left;
      const left = Math.max(16, Math.min(rawLeft, window.innerWidth - panelWidth - 16));
      const viewportPadding = 16;
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
      const spaceAbove = rect.top - viewportPadding - gap;
      const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;

      setCoords({
        ...(openAbove ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
        left,
        minWidth: rect.width,
        maxHeight: Math.min(window.innerHeight * 0.85, Math.max(0, availableSpace))
      });
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

  if (typeof document === 'undefined' || !coords) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="field-popover"
          ref={panelRef}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: coords.top,
            bottom: coords.bottom,
            left: coords.left,
            minWidth: coords.minWidth,
            maxHeight: coords.maxHeight,
            zIndex: 100
          }}
          className={cn(SEARCH_OVERLAY_CLASS, 'pointer-events-auto max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain p-4', className)}
          onWheel={(event) => event.stopPropagation()}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
