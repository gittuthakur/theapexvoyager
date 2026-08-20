'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

export interface CountUpProps {
  value: string;
  className?: string;
}

interface ParsedStat {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  hasCommas: boolean;
}

function parseStatValue(raw: string): ParsedStat | null {
  const match = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const cleaned = numStr.replace(/,/g, '');
  return {
    prefix,
    suffix,
    target: parseFloat(cleaned),
    decimals: cleaned.includes('.') ? cleaned.split('.')[1].length : 0,
    hasCommas: numStr.includes(',')
  };
}

function formatStat(n: number, { prefix, suffix, decimals, hasCommas }: ParsedStat) {
  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const groupedInt = hasCommas ? Number(intPart).toLocaleString('en-US') : intPart;
  return `${prefix}${decPart ? `${groupedInt}.${decPart}` : groupedInt}${suffix}`;
}

// Counts up from 0 to the target once it scrolls into view — one-shot, no
// looping. Values that aren't a simple number (parseStatValue returns null)
// render as-is, unanimated.
export default function CountUp({ value, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const parsed = useMemo(() => parseStatValue(value), [value]);
  // Initial render (including SSR/no-JS output) shows the real target value, not 0 — the
  // count-from-0 animation below is a progressive enhancement that takes over once the
  // element scrolls into view, not the only path to a correct number.
  const [display, setDisplay] = useState(() => (parsed ? formatStat(parsed.target, parsed) : value));

  useEffect(() => {
    if (!isInView || !parsed) return;
    const controls = animate(0, parsed.target, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(formatStat(latest, parsed))
    });
    return () => controls.stop();
  }, [isInView, parsed]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
