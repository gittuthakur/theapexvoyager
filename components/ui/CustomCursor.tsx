'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cursorVariants } from '@/lib/motion';

export interface CustomCursorProps {
  hoverSelector?: string;
  size?: number;
}

export default function CustomCursor({ hoverSelector = 'button, a, .cursor-hover', size = 16 }: CustomCursorProps) {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const move = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
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
  }, [hoverSelector]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 mix-blend-difference"
      style={{ width: size, height: size }}
      animate={{ x: position.x, y: position.y, ...(isHovering ? cursorVariants.hover : cursorVariants.default) }}
      transition={{ type: 'spring', stiffness: 500, damping: 45 }}
    >
      <motion.div className="h-full w-full rounded-full bg-white" />
    </motion.div>
  );
}
