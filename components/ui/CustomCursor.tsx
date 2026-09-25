'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cursorVariants } from '@/lib/motion';

export interface CustomCursorProps {
  hoverSelector?: string;
  size?: number;
}

const POSITION_SPRING = { stiffness: 500, damping: 45 };

// A custom cursor only makes sense on a device whose primary pointer is a
// mouse/trackpad: (pointer: fine) + (hover: hover) together, rather than just
// "not coarse", so a touchscreen laptop or tablet that happens to also expose
// a mouse still gets the overlay only when that mouse is the primary input.
// prefers-reduced-motion is folded into the same query so both conditions are
// tracked by one MediaQueryList instead of three.
const ELIGIBLE_QUERY = '(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)';

export default function CustomCursor({ hoverSelector = 'button, a, .cursor-hover', size = 16 }: CustomCursorProps) {
  // Starts false so server and first client render both paint nothing — the
  // real capability is only knowable client-side, and a mount-time check kept
  // in an effect (matching SmoothScroll's prefers-reduced-motion check) avoids
  // a hydration mismatch. It's corrected to the real value immediately after
  // mount, then kept in sync if the OS/DevTools capability changes at runtime.
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(ELIGIBLE_QUERY);
    setEligible(mql.matches);
    const update = () => setEligible(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  // Motion values write straight to the transform on every mousemove without
  // going through React state/render — a plain useState here would re-render
  // this tree on every pixel of pointer movement. useSpring keeps the same
  // trailing-follow easing the old animate={{ x, y }} transition produced.
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const x = useSpring(rawX, POSITION_SPRING);
  const y = useSpring(rawY, POSITION_SPRING);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Ineligible devices/preferences never attach the listeners below at all —
    // not merely hidden via CSS while the mousemove/hover runtime keeps going.
    if (!eligible) return;

    const move = (event: MouseEvent) => {
      rawX.set(event.clientX);
      rawY.set(event.clientY);
    };
    const addHover = () => setIsHovering(true);
    const removeHover = () => setIsHovering(false);

    document.addEventListener('mousemove', move);
    const targets = document.querySelectorAll(hoverSelector);
    targets.forEach((element) => {
      element.addEventListener('mouseenter', addHover);
      element.addEventListener('mouseleave', removeHover);
    });

    return () => {
      document.removeEventListener('mousemove', move);
      targets.forEach((element) => {
        element.removeEventListener('mouseenter', addHover);
        element.removeEventListener('mouseleave', removeHover);
      });
    };
  }, [eligible, hoverSelector]);

  if (!eligible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 mix-blend-difference"
      style={{ width: size, height: size, x, y }}
      animate={{ ...(isHovering ? cursorVariants.hover : cursorVariants.default) }}
      transition={{ type: 'spring', stiffness: 500, damping: 45 }}
    >
      <motion.div className="h-full w-full rounded-full bg-white" />
    </motion.div>
  );
}
