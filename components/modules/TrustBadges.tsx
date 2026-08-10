'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Headphones, ShieldCheck, Tag, type LucideIcon } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface TrustBadge {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TrustBadgesProps {
  items?: TrustBadge[];
  className?: string;
}

const defaultBadges: TrustBadge[] = [
  { icon: Tag, title: 'Best Price Guarantee', description: 'We price match' },
  { icon: Headphones, title: '24/7 Support', description: "We're here to help" },
  { icon: CheckCircle2, title: 'Easy Booking', description: 'Book in just 2 minutes' },
  { icon: ShieldCheck, title: 'Secure Payment', description: 'Your data is safe' }
];

export default function TrustBadges({ items = defaultBadges, className }: TrustBadgesProps) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      aria-label="Why travelers book with The Apex Voyager"
      className={cn('grid grid-cols-2 gap-3 list-none sm:grid-cols-4', className)}
    >
      {items.map(({ icon: Icon, title, description }) => (
        <motion.li
          key={title}
          variants={fadeInUp}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/15 px-4 py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-apex-500/20 text-apex-300">
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{title}</span>
            <span className="block truncate text-xs text-slate-400">{description}</span>
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
