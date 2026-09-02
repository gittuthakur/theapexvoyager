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
  /** Opt-in id/role/label for the portalled panel — all omitted by default, so
   *  every existing consumer is unaffected. Pass `role="dialog"` for a panel
   *  whose content is genuinely dialog-like (a titled settings/filter panel),
   *  together with `ariaLabelledBy` pointing at that title's own id — WAI-ARIA
   *  requires a `role="dialog"` to have an accessible name. */
  id?: string;
  role?: 'dialog';
  ariaLabelledBy?: string;
  /** Opt-in, off by default. Escalates the `role="dialog"` panel to a genuine
   *  modal: `aria-modal="true"`, initial focus moves to the panel's own first
   *  focusable control on open, Tab/Shift+Tab are contained within the panel,
   *  and every other direct child of `document.body` is marked `inert` +
   *  `aria-hidden` while open (restored on close) so background content is
   *  reachable by neither keyboard nor pointer nor screen reader. Every other
   *  consumer stays exactly as before — this only changes behavior for a
   *  caller that explicitly opts in. */
  modal?: boolean;
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
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FieldPopover({ open, onClose, anchorRef, children, width, align = 'left', className, id, role, ariaLabelledBy, modal }: FieldPopoverProps) {
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
    // In modal mode this Tab handling is what "Tab/Shift+Tab remain inside the
    // drawer" means in practice: wrap at the panel's own first/last focusable
    // control instead of letting focus continue into whatever's next/previous in
    // real DOM order (which, portalled to the end of body, would otherwise be
    // background content). Non-modal popovers never trap Tab, unchanged.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (!modal || event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const insidePanel = active instanceof Node && panelRef.current.contains(active);
      if (event.shiftKey) {
        if (!insidePanel || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!insidePanel || active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, anchorRef, modal]);

  // Modal-only: moves focus inside the panel once (per open cycle) as soon as it
  // has actually mounted (`coords` flips from null once the position effect
  // above runs) — prefers the panel's own first focusable control, which for
  // every current modal consumer is the visible Close button. Non-modal popovers
  // never do this (see the restore-only effect below), matching the existing,
  // deliberate "doesn't steal focus on open" behavior for e.g. DestinationField.
  const focusedThisOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      focusedThisOpenRef.current = false;
      return;
    }
    if (!modal || focusedThisOpenRef.current || !panelRef.current) return;
    const focusable = panelRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.focus();
    focusedThisOpenRef.current = true;
  }, [open, modal, coords]);

  // Modal-only: while open, every other direct child of <body> (the app root,
  // and any other portal already mounted there) is excluded from keyboard,
  // pointer and screen-reader interaction — this panel is the only reachable
  // surface, matching what "aria-modal" claims rather than leaving it dishonest.
  // Explicitly excludes this panel's own node (`panelRef.current`) rather than
  // relying on it not existing as a body child yet: `coords` (below) isn't
  // reset when the popover closes, so on every open *after* the first the
  // panel already carries its last-known position and portals in on the very
  // same commit as `open` flipping true — by the time this effect runs, its
  // own node is already a body child, and without the explicit exclusion it
  // would self-inert, making the whole panel unreachable until the page
  // reloads.
  //
  // A body child isn't only whatever's already there when this effect runs —
  // something else (a toast, another portal) can mount straight onto <body>
  // while this modal is still open, and without watching for that it would be
  // fully interactive behind the modal. A single `MutationObserver` on body's
  // own childList (one per open cycle, torn down with everything else below)
  // isolates any such newcomer — except this panel itself — the moment it
  // arrives, using the same per-element capture/restore shape as the initial
  // pass so both share one `state` map and one cleanup. A node removed again
  // before close (e.g. a toast that auto-dismisses) is simply dropped from the
  // map — nothing left to restore, and removing attributes from a detached
  // element is safe regardless.
  useEffect(() => {
    if (!open || !modal) return;
    const state = new Map<Element, { hadInert: boolean; ariaHidden: string | null }>();

    function isolate(el: Element) {
      if (el === panelRef.current || state.has(el)) return;
      state.set(el, { hadInert: el.hasAttribute('inert'), ariaHidden: el.getAttribute('aria-hidden') });
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    }

    Array.from(document.body.children).forEach(isolate);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element && node.parentElement === document.body) isolate(node);
        });
        mutation.removedNodes.forEach((node) => {
          if (node instanceof Element) state.delete(node);
        });
      }
    });
    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
      state.forEach(({ hadInert, ariaHidden }, el) => {
        if (!hadInert) el.removeAttribute('inert');
        if (ariaHidden === null) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', ariaHidden);
      });
    };
  }, [open, modal]);

  // By default this is a non-modal popover (the anchor field stays interactive
  // while it's open — e.g. DestinationField keeps typing into its input), so
  // unlike Modal/FloatingOverlay it deliberately doesn't steal focus on open or
  // trap Tab unless a caller opts into `modal` above. Every consumer — modal or
  // not — still needs focus handed back to the trigger on close: otherwise
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
        const focusable = anchor.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
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
          id={id}
          role={role}
          aria-modal={role && modal ? 'true' : undefined}
          aria-labelledby={role ? ariaLabelledBy : undefined}
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
