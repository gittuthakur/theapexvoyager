'use client';

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

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
  useBodyScrollLock(open);

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
            role="dialog"
            aria-modal="true"
            aria-label={label}
            aria-labelledby={labelledBy}
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
