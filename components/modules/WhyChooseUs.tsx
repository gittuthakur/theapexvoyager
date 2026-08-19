'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Headphones, Heart, Shield, ShieldCheck, Sparkles, Tag, type LucideIcon } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';

export interface WhyChooseUsItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface WhyChooseUsProps {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: WhyChooseUsItem[];
}

const defaultItems: WhyChooseUsItem[] = [
  {
    icon: Sparkles,
    title: 'Curated With Care',
    description: 'Every destination, stay and journey is handpicked and vetted before it ever reaches our catalog.'
  },
  {
    icon: ShieldCheck,
    title: 'Local Expertise',
    description:
      'Travel with people who know the mountains best. Our local knowledge helps you discover authentic places and hidden gems.'
  },
  {
    icon: Tag,
    title: 'Best Price Promise',
    description: "Transparent, fair pricing on every itinerary — no hidden markups, no surprise add-ons."
  },
  {
    icon: Shield,
    title: 'Safe & Reliable',
    description: 'Verified partners, trained guides and 24/7 monitoring keep every trip safe from start to finish.'
  },
  {
    icon: Heart,
    title: 'Personalized Trips',
    description:
      'Your journey, designed around you. From destinations and activities to pace and budget, we tailor every trip to your style.'
  },
  {
    icon: Headphones,
    title: '24/7 Assistance',
    description:
      "We're with you, every step of the journey. Get dedicated support before, during, and after your trip."
  }
];

export default function WhyChooseUs({
  eyebrow = 'The Apex difference',
  title = 'Why travel with',
  highlight = 'The Apex Voyager?',
  description = "We don't just book trips. We build experiences grounded in local knowledge, responsible travel, and genuine care for every guest, from first inquiry to farewell.",
  ctaLabel = 'Learn About Us',
  ctaHref = '/about',
  items = defaultItems
}: WhyChooseUsProps) {
  return (
    <section className="bg-slate-100 py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6">

        <div className="grid gap-8 lg:grid-cols-[0.90fr_1.10fr] lg:items-center lg:gap-10">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
            <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              {title} <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlight}</span>
            </h2>
            <p className="mt-5 max-w-md text-slate-600">{description}</p>
            <Link
              href={ctaHref}
              className="cursor-hover mt-8 inline-flex items-center gap-2 rounded-xl bg-apex-500 px-7 py-4 font-medium text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              {ctaLabel}
              <ArrowRight size={24} />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {items.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
              <motion.article
                key={itemTitle}
                variants={fadeInUp}
                className="flex gap-3 rounded-xl border border-slate-300 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{itemTitle}</h3>
                  <p className="mt-1 text-sm text-slate-600">{itemDescription}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
