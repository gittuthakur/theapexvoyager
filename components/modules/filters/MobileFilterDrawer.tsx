'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FieldPopover } from '@/components/modules/search/FieldPopover';
import { filterTriggerClass } from './filterStyles';

// A filter-Link selection (e.g. clicking "Villas") navigates to a new URL whose
// Suspense boundary is keyed by the active filters (see app/stays/search/page.tsx),
// which remounts this entire component — including the trigger button `FieldPopover`
// restores focus to on close. By the time that restore runs, the old anchor is
// already gone, so it silently gives up and focus is left on <body>.
//
// This module-level value survives the remount (it lives outside the component tree
// that gets destroyed/recreated) so the fresh instance can pick focus back up on its
// own trigger. It's keyed by the exact href a filter link was navigating to —
// captured synchronously, in a capture-phase click listener, before Next's own Link
// handler starts the navigation — rather than a wall-clock timestamp with an expiry
// window: a real navigation can legitimately take anywhere from 0ms to several
// seconds (cold server, slow device), and a fixed window would either fire too late
// on a slow one or stay a needless correctness dependency on how fast the network
// happens to be. Every mount checks the pending value against the current location
// and clears it unconditionally either way: a match means "this is the page that
// click was headed to, focus the trigger"; a mismatch (the navigation was aborted,
// failed, or a later, unrelated mount got there first) means "not for this page,"
// and dropping it here — rather than leaving it for the next mount to maybe match —
// is what keeps it from leaking into some future, unrelated page load. react-strict-
// mode's dev-only double-invoke is safe against this: the second (of two) mount-
// effect invocations simply finds the value already cleared by the first.
// `MobileFilterDrawer` has exactly one consumer today (StayFilters); if a second
// ever renders on the same page simultaneously, only whichever mounts first would
// claim a given restore — an accepted, narrow limitation given today's
// single-consumer reality, not a correctness hazard.
let pendingFocusRestoreHref: string | null = null;

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Captures the destination of a filter-link click *before* Next's own Link
  // handler starts the navigation — the deterministic trigger the mount effect
  // below matches against, instead of guessing from elapsed time. Scoped to
  // clicks inside this drawer's own portalled panel (by `panelId`) so it never
  // picks up an unrelated link elsewhere on the page.
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const panel = document.getElementById(panelId);
      const target = event.target as Element | null;
      if (!panel || !target || !panel.contains(target)) return;
      const link = target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      const url = new URL(href, window.location.href);
      pendingFocusRestoreHref = url.pathname + url.search;
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [open, panelId]);

  // The other half of the same fix: a fresh instance (mounted for the newly
  // filtered results) claims a pending href left by its predecessor — if it
  // matches where the browser actually ended up — and restores focus to its own
  // trigger, the same place every other close path already lands. Cleared
  // unconditionally so it can never outlive this one check (see the comment on
  // `pendingFocusRestoreHref` above for why a mismatch is still cleared here).
  useEffect(() => {
    const pendingHref = pendingFocusRestoreHref;
    pendingFocusRestoreHref = null;
    if (pendingHref && pendingHref === window.location.pathname + window.location.search) {
      triggerRef.current?.focus();
    }
  }, []);

  // The trigger is only rendered (`xl:hidden`) below the 1280px breakpoint, but
  // nothing previously told the popover's own `open` state that the viewport grew
  // past it — so resizing past 1280px while open left a real, interactive,
  // scroll-locking panel behind (duplicated with the now-visible desktop sidebar)
  // that no longer had a visible trigger to close it. Closing here reuses
  // FieldPopover's own already-correct close machinery (scroll unlock, exit
  // animation) the moment mobile-only chrome stops being relevant.
  //
  // FieldPopover's own generic restore-on-close effect will still try to hand
  // focus back to this trigger, but by the time this fires the CSS media query
  // has already taken `xl:hidden` effect on the trigger's whole wrapper —
  // `display:none` can't be focused, so that attempt silently no-ops and,
  // left alone, focus would fall through to <body>. Redirecting it to the
  // page's own <main> landmark (present on every route this drawer is used on)
  // keeps it on a real, visible, stable element instead — a temporary
  // `tabindex` only if <main> doesn't already have one, removed again on blur
  // so it doesn't linger in the tab order.
  //
  // Deferred a frame for the same reason FieldPopover's own restore-on-close
  // effect defers: the browser's own "focused element just became hidden"
  // blur-to-<body> fixup doesn't necessarily run synchronously within this
  // handler — call `focus()` here directly and that fixup can still land
  // afterward and steal it right back. Waiting a frame lets it settle first.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1280px)');
    function handleChange(event: MediaQueryListEvent) {
      if (!event.matches || !openRef.current) return;
      setOpen(false);
      requestAnimationFrame(() => {
        const main = document.querySelector('main');
        if (!main) return;
        const hadTabIndex = main.hasAttribute('tabindex');
        if (!hadTabIndex) main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
        if (!hadTabIndex) {
          const clearTabIndex = () => {
            main.removeAttribute('tabindex');
            main.removeEventListener('blur', clearTabIndex);
          };
          main.addEventListener('blur', clearTabIndex);
        }
      });
    }
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="flex items-center justify-between gap-2 xl:hidden">
      <div ref={anchorRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
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

        <FieldPopover
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={anchorRef}
          width={340}
          align="left"
          className="z-50"
          id={panelId}
          role="dialog"
          ariaLabelledBy={titleId}
          modal
        >
          <div className="flex items-center justify-between px-1">
            <p id={titleId} className="text-sm font-bold text-slate-900">{panelTitle}</p>
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
