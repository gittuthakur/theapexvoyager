'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Gem, Heart, Mountain, Route, Tent, Users, type LucideIcon } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';

interface TravelStyle {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

const travelStyles: TravelStyle[] = [
  {
    slug: 'adventure',
    title: 'Adventure',
    description: 'For adrenaline-filled mountain experiences.',
    icon: Mountain,
    href: '/tours?category=adventure'
  },
  {
    slug: 'luxury',
    title: 'Luxury',
    description: 'Premium stays and elevated Himalayan experiences.',
    icon: Gem,
    href: '/tours?category=luxury'
  },
  {
    slug: 'honeymoon',
    title: 'Honeymoon',
    description: 'Romantic journeys designed for two.',
    icon: Heart,
    href: '/tours?category=honeymoon'
  },
  {
    slug: 'family',
    title: 'Family',
    description: 'Comfortable and memorable family escapes.',
    icon: Users,
    href: '/tours?category=family'
  },
  {
    slug: 'road-trips',
    title: 'Road Trips',
    description: "Scenic drives through India's most spectacular landscapes.",
    icon: Route,
    href: '/tours?category=road-trips'
  },
  {
    slug: 'offbeat',
    title: 'Offbeat',
    description: 'Discover quieter places beyond the usual tourist routes.',
    icon: Compass,
    href: '/tours?category=offbeat'
  },
  {
    slug: 'camping',
    title: 'Camping',
    description: 'Sleep under the stars and experience nature closer.',
    icon: Tent,
    href: '/tours?category=camping'
  }
];

export default function TravelStyleGrid() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-14 lg:py-20">
      <div className='mx-auto max-w-[1440px] px-6'>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">Find Your Perfect Journey</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Explore by <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">Travel Style</span></h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {travelStyles.map(({ slug, title, description, icon: Icon, href }) => (
            <motion.div key={slug} variants={fadeInUp}>
              <Link
                href={href}
                className="cursor-hover group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-glow transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-apex-400/50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-apex-50 text-apex-600 transition group-hover:bg-apex-100">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-6 text-slate-500">{description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
