'use client';

import { motion } from 'framer-motion';
import { Headphones, MapPin, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
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

// "Best Price Promise"/"we won't be beaten on price" and "24/7 Support" were absolute
// claims with no price-match policy or staffed round-the-clock support behind them —
// reworded to what's actually true: transparent, no-markup pricing and real, reachable
// contact channels (WhatsApp/phone/email — see config/site.config.ts).
const defaultBadges: TrustBadge[] = [
  { icon: Sparkles, title: 'Curated Destinations', description: 'Handpicked places' },
  { icon: ShieldCheck, title: 'Transparent Pricing', description: 'Clear pricing, no hidden markups' },
  { icon: MapPin, title: 'Trusted Local Experts', description: 'On-ground knowledge' },
  { icon: Headphones, title: 'Travel Support', description: "We're here to help" }
];

export default function TrustBadges({ items = defaultBadges, className }: TrustBadgesProps) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      aria-label="Why travelers book with The Apex Voyager"
      className={cn('grid sm:grid-cols-2 gap-3 list-none xl:grid-cols-4', className)}
    >
      {items.map(({ icon: Icon, title, description }) => (
        <motion.li
          key={title}
          variants={fadeInUp}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-apex-100 text-apex-600">
            <Icon size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900">{title}</span>
            <span className="block truncate text-sm text-slate-500">{description}</span>
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
