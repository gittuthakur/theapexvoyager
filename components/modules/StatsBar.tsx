'use client';

import { motion } from 'framer-motion';
import { statsItems } from '@/config/stats.config';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import CountUp from '@/components/ui/CountUp';
import type { StatItem } from '@/types';

export interface StatsBarProps {
  items?: StatItem[];
  className?: string;
}

export default function StatsBar({ items = statsItems, className }: StatsBarProps) {
  return (
    <section aria-label="The Apex Voyager in numbers" className={cn('border-y border-slate-100 bg-slate-100', className)}>
      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="mx-auto grid max-w-[1440px] list-none grid-cols-2 gap-y-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:flex lg:grid-cols-none lg:justify-between lg:gap-0 lg:divide-x lg:divide-slate-300 lg:px-8"
      >
        {items.map((item) => (
          <motion.li
            key={item.label}
            variants={fadeInUp}
            className="flex min-w-0 flex-col items-center gap-1 px-2 text-center lg:flex-1 lg:px-6"
          >
            <CountUp value={item.value} className="text-2xl font-extrabold text-apex-600 sm:text-3xl lg:text-4xl" />
            <span className="text-xs text-slate-500 sm:text-sm">{item.label}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
