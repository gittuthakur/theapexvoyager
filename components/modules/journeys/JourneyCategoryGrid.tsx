'use client';

import { type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, Landmark, Mountain, Sparkles, Users } from 'lucide-react';
import { getPackageCategoriesWithCounts } from '@/lib/packageFilters';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { TravelPackage } from '@/types';

export interface JourneyCategoryGridProps {
  packages: TravelPackage[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

// Presentational only — icon + one-line description per real category value in the
// catalog (see config/packages.config.ts). No category is shown here that isn't
// actually present in the data (getPackageCategoriesWithCounts derives that list).
const CATEGORY_META: Record<string, { icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; description: string }> = {
  adventure: { icon: Mountain, description: 'High passes, remote valleys and trips built for the trail.' },
  family: { icon: Users, description: 'Easy pacing and stays the whole family will enjoy.' },
  honeymoon: { icon: Heart, description: 'Quiet mountain towns and romantic stays for two.' },
  luxury: { icon: Sparkles, description: 'Premium stays and unhurried, elevated itineraries.' },
  offbeat: { icon: Compass, description: 'Villages and valleys most itineraries skip.' },
  spiritual: { icon: Landmark, description: 'Sacred trails, ghats and Himalayan monasteries.' }
};

function metaFor(category: string) {
  return CATEGORY_META[category.toLowerCase()] ?? { icon: Compass, description: 'A curated Himalayan journey.' };
}

export default function JourneyCategoryGrid({ packages, activeCategory, onSelect }: JourneyCategoryGridProps) {
  const categories = getPackageCategoriesWithCounts(packages);
  if (!categories.length) return null;

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Find Your Kind of Journey</p>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7"
      >
        <motion.button
          type="button"
          variants={fadeInUp}
          onClick={() => onSelect('all')}
          className={cn(
            'cursor-hover flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1',
            activeCategory === 'all' ? 'border-apex-500 bg-apex-50' : 'border-slate-200 bg-white hover:border-apex-400/50'
          )}
        >
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              activeCategory === 'all' ? 'bg-apex-500 text-white' : 'bg-apex-50 text-apex-600'
            )}
          >
            <Compass size={20} strokeWidth={1.5} />
          </span>
          <span className="text-sm font-semibold text-slate-900">All Journeys</span>
          <span className="text-xs leading-5 text-slate-500">Every curated Himalayan journey we offer.</span>
          <span className="mt-auto text-xs font-semibold text-apex-600">{packages.length} journeys</span>
        </motion.button>

        {categories.map(({ category, count }) => {
          const { icon: Icon, description } = metaFor(category);
          const active = activeCategory === category;
          return (
            <motion.button
              type="button"
              key={category}
              variants={fadeInUp}
              onClick={() => onSelect(category)}
              className={cn(
                'cursor-hover flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1',
                active ? 'border-apex-500 bg-apex-50' : 'border-slate-200 bg-white hover:border-apex-400/50'
              )}
            >
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', active ? 'bg-apex-500 text-white' : 'bg-apex-50 text-apex-600')}>
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <span className="text-sm font-semibold text-slate-900">{category}</span>
              <span className="text-xs leading-5 text-slate-500">{description}</span>
              <span className="mt-auto text-xs font-semibold text-apex-600">
                {count} journey{count === 1 ? '' : 's'}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
