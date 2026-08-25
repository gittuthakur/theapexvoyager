'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { siteConfig } from '@/config/site.config';

export interface FinalCtaProps {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
}

export default function FinalCta({
  eyebrow = 'Your next adventure starts here',
  title = 'Ready to ',
  highlight = 'go beyond?',
  subtitle = "Tell us where you want to go and our team will craft a journey you'll talk about for years — no cookie-cutter itineraries, only yours.",
  primaryLabel = 'Plan My Trip',
  primaryHref = '/plan-my-journey',
  secondaryLabel = 'Talk to an Expert'
}: FinalCtaProps) {
  return (
    <section className="py-14 lg:py-20 bg-white px-6">
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-[0.16em] text-apex-600">
          {eyebrow}
        </motion.p>
        <motion.h2 variants={fadeInUp} className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
          {title} <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlight}</span>
        </motion.h2>
        <motion.p variants={fadeInUp} className="mt-4 max-w-xl text-slate-600">
          {subtitle}
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href={primaryHref}
            className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            {primaryLabel}
            <ArrowRight size={16} />
          </Link>
          <a
            href={siteConfig.contactPhoneHref}
            className="cursor-hover inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-8 py-3.5 text-sm font-semibold text-slate-900 transition-all duration-300 ease-in-out hover:bg-slate-100"
          >
            <Phone size={16} />
            {secondaryLabel}
          </a>
        </motion.div>
      </motion.section>
    </section>
  );
}
