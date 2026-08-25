'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface FloatingOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
  labelledBy?: string;
  overlayClassName?: string;
  panelClassName?: string;
}

/**
 * The one viewport-overlay primitive for dialogs and full-screen popups.
 *
 * The overlay, rather than the panel, owns scrolling by default. This lets the panel
 * grow to its natural height while keeping every edge reachable on small viewports.
 * Callers that need a bounded panel with its own internal scroll region (e.g. a
 * fixed header with scrollable body) can override height/overflow via panelClassName.
 */
export function FloatingOverlay({
  open,
  onClose,
  children,
  label,
  labelledBy,
  overlayClassName,
  panelClassName
}: FloatingOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Moves focus into the dialog on open, traps Tab/Shift+Tab within it while
  // open (so background page content isn't keyboard-reachable behind the
  // overlay), and returns focus to whatever triggered the dialog on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function getFocusable(): HTMLElement[] {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.offsetParent !== null);
    }

    const raf = requestAnimationFrame(() => {
      const [first] = getFocusable();
      (first ?? panelRef.current)?.focus();
    });

    function handleTabTrap(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panelRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleTabTrap);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleTabTrap);
      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            'fixed inset-0 pointer-events-auto z-50 flex items-center justify-center overflow-y-auto overscroll-hidden bg-slate-950/80 p-4 sm:p-6',
            overlayClassName
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={cn('pointer-events-auto relative my-auto h-fit w-full max-w-2xl', panelClassName)}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
