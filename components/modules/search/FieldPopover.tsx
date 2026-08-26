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

/** Walks up from the anchor to whichever ancestor sits directly inside a <form> —
 *  i.e. the field-row container a search bar's fields share, excluding a sibling
 *  submit button that lives outside that container as the form's other direct
 *  child. Returns null when the anchor isn't inside a <form> at all, so callers can
 *  fall back to viewport-only bounds unchanged. */
function getRowBoundary(anchor: HTMLElement): DOMRect | null {
  let node: HTMLElement | null = anchor;
  while (node && node.parentElement) {
    if (node.parentElement.tagName === 'FORM') return node.getBoundingClientRect();
    node = node.parentElement;
  }
  return null;
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
    maxWidth?: number;
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
      const viewportPadding = 16;
      // When the field sits in a row alongside other controls (e.g. a submit button
      // next to the search fields), constrain the popover to the field-row's own
      // right edge so a wide popover can't visually spill sideways onto a sibling
      // control and steal its clicks. `getRowBoundary` only returns a rect for that
      // specific shape (a <form> whose direct child holds the fields); everywhere
      // else this is a no-op and behaviour is unchanged.
      const rowBoundary = getRowBoundary(anchor);
      const maxRight = rowBoundary ? Math.min(window.innerWidth - viewportPadding, rowBoundary.right) : window.innerWidth - viewportPadding;
      const rawLeft = align === 'right' ? rect.right - panelWidth : rect.left;
      const left = Math.max(viewportPadding, Math.min(rawLeft, maxRight - panelWidth));
      // The panel otherwise only carries a `min-width` (below), so its actual
      // rendered width is free to grow from content — wide enough, on its own, to
      // reach past `left` and back into the row boundary the clamp above just
      // established. Cap it explicitly wherever that boundary exists; everywhere
      // else (no <form> ancestor) leave it undefined, same as before this fix.
      const maxWidth = rowBoundary ? Math.max(rect.width, maxRight - left) : undefined;
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
      const spaceAbove = rect.top - viewportPadding - gap;
      const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;

      setCoords({
        ...(openAbove ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
        left,
        minWidth: rect.width,
        maxWidth,
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

  // This is a non-modal popover (the anchor field stays interactive while it's
  // open — e.g. DestinationField keeps typing into its input), so unlike Modal/
  // FloatingOverlay it deliberately doesn't steal focus on open or trap Tab.
  // It does still need to hand focus back to the trigger on close — otherwise
  // Escape/an outside click/a "Done" button leaves focus on a node that's about
  // to unmount (or nowhere at all) instead of the field that opened it.
  useEffect(() => {
    if (!open) return;
    return () => {
      // Deferred a frame: an outside mousedown closes the popover (flipping `open`
      // to false) before the browser's own default action blurs the just-clicked-
      // away-from trigger to document.body — checking activeElement synchronously
      // here would see the trigger as "still focused" and skip restoring it, then
      // the browser's blur lands a moment later with nothing to catch it, leaving
      // focus on body. Waiting a frame lets that blur (if any) settle first.
      requestAnimationFrame(() => {
        const anchor = anchorRef.current;
        if (!anchor || anchor.contains(document.activeElement)) return;
        const focusable = anchor.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    };
  }, [open, anchorRef]);

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
            maxWidth: coords.maxWidth,
            maxHeight: coords.maxHeight,
            zIndex: 100
          }}
          className={cn(SEARCH_OVERLAY_CLASS, 'pointer-events-auto max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain p-4', className)}
          onWheel={(event) => event.stopPropagation()}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
