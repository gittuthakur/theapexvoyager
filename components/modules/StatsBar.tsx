'use client';

import { motion } from 'framer-motion';
import { statsItems } from '@/config/stats.config';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { StatItem } from '@/types';

export interface StatsBarProps {
  items?: StatItem[];
  className?: string;
}

export default function StatsBar({ items = statsItems, className }: StatsBarProps) {
  return (
    <section aria-label="The Apex Voyager in numbers" className={cn('border-y border-white/5 bg-slate-900', className)}>
      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="mx-auto grid max-w-7xl list-none grid-cols-2 gap-y-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:flex lg:grid-cols-none lg:justify-between lg:gap-0 lg:divide-x lg:divide-white/10 lg:px-8"
      >
        {items.map((item) => (
          <motion.li
            key={item.label}
            variants={fadeInUp}
            className="flex min-w-0 flex-col items-center gap-1 px-2 text-center lg:flex-1 lg:px-6"
          >
            <span className="text-2xl font-extrabold text-apex-300 sm:text-3xl lg:text-4xl">{item.value}</span>
            <span className="text-xs text-slate-400 sm:text-sm">{item.label}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
