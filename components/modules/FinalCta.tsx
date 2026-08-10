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
  title = 'Ready to go',
  highlight = 'beyond?',
  subtitle = "Tell us where you want to go and our team will craft a journey you'll talk about for years — no cookie-cutter itineraries, only yours.",
  primaryLabel = 'Plan My Trip',
  primaryHref = '/booking',
  secondaryLabel = 'Talk to an Expert'
}: FinalCtaProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="mx-auto mt-20 flex max-w-3xl flex-col items-center px-6 text-center sm:px-10 lg:mt-28 lg:px-16"
    >
      <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">
        {eyebrow}
      </motion.p>
      <motion.h2 variants={fadeInUp} className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
        {title} <span className="text-apex-300">{highlight}</span>
      </motion.h2>
      <motion.p variants={fadeInUp} className="mt-4 max-w-xl text-slate-300">
        {subtitle}
      </motion.p>
      <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href={primaryHref}
          className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition hover:scale-105 hover:bg-apex-400"
        >
          {primaryLabel}
          <ArrowRight size={16} />
        </Link>
        <a
          href={`tel:${siteConfig.contactPhone}`}
          className="cursor-hover inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition hover:scale-105 hover:bg-white/10"
        >
          <Phone size={16} />
          {secondaryLabel}
        </a>
      </motion.div>
    </motion.section>
  );
}
