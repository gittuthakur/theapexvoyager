'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { fadeInUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface ImageCtaBannerProps {
  eyebrow?: string;
  titlePrefix?: string;
  highlight?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  media: { src: string; alt: string };
  className?: string;
}

export default function ImageCtaBanner({
  eyebrow = 'Beyond the tourist trail',
  titlePrefix = 'Real expeditions ',
  highlight = 'real Himachal',
  subtitle = 'Experience raw Himalayan beauty without compromising on comfort. Small groups, exclusive access, zero hassle.',
  ctaLabel = 'Explore All Tours',
  ctaHref = '/tours',
  media,
  className
}: ImageCtaBannerProps) {
  return (
    <section className={cn('relative isolate overflow-hidden', className)}>
      <div className="absolute inset-0">
        <SafeImage src={media.src} alt={media.alt} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830]/85 to-transparent" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center"
      >
        <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">
          {eyebrow}
        </motion.p>
        <motion.h2 variants={fadeInUp} className="mt-4 text-3xl font-bold text-white sm:text-4xl">
          {titlePrefix}
          <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-[#60A5FA]/100 via-[#38BDF8]/100 to-[#67E8F9]/100 bg-clip-text text-transparent">
            {highlight}
          </span>
        </motion.h2>
        <motion.p variants={fadeInUp} className="mt-5 max-w-xl text-slate-300">
          {subtitle}
        </motion.p>
        <motion.div variants={fadeInUp}>
          <Link
            href={ctaHref}
            className="cursor-hover mt-12 inline-flex items-center gap-2 rounded-lg bg-apex-500 px-10 py-5 font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
          >
            {ctaLabel}
            <ArrowRight size={24} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
