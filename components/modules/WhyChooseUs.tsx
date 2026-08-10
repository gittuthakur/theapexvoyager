'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Headphones, ShieldCheck, Tent } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import type { TrustBadge } from './TrustBadges';

export interface WhyChooseUsProps {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: TrustBadge[];
}

const defaultItems: TrustBadge[] = [
  {
    icon: ShieldCheck,
    title: '99.4% Safety Record',
    description: 'High-altitude oxygen setups, satellite GPS tracking, and certified first-aid experts on every expedition.'
  },
  {
    icon: Compass,
    title: 'Uncharted & Private Trails',
    description: 'We bypass the crowded tourist spots, taking you to secret valleys only local experts know.'
  },
  {
    icon: Tent,
    title: 'Curated Mountain Comfort',
    description: 'Off-grid adventures without compromise — premium boutique stays, cozy camps, and authentic local dining.'
  },
  {
    icon: Headphones,
    title: '24/7 Personal Concierge',
    description: 'From your first enquiry to your journey home, a dedicated team is on call around the clock.'
  }
];

export default function WhyChooseUs({
  eyebrow = 'The Apex difference',
  title = 'Why travelers',
  highlight = 'choose us',
  description = "We don't just book trips. We build experiences grounded in local knowledge, responsible travel, and genuine care for every guest, from first inquiry to farewell.",
  ctaLabel = 'Learn About Us',
  ctaHref = '/about',
  items = defaultItems
}: WhyChooseUsProps) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-6 sm:px-10 lg:mt-28 lg:px-16">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {title} <span className="text-apex-300">{highlight}</span>
          </h2>
          <p className="mt-5 max-w-md text-slate-300">{description}</p>
          <Link
            href={ctaHref}
            className="cursor-hover mt-8 inline-flex items-center gap-2 rounded-full bg-apex-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/20 transition hover:scale-105 hover:bg-apex-400"
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid gap-4 sm:grid-cols-2"
        >
          {items.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
            <motion.article
              key={itemTitle}
              variants={fadeInUp}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-apex-500/20 text-apex-300">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{itemTitle}</h3>
              <p className="mt-2 text-sm text-slate-400">{itemDescription}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
