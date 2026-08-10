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
  titlePrefix = '',
  highlight = 'Real expeditions, real Himachal',
  subtitle = 'Experience raw Himalayan beauty without compromising on comfort. Small groups, exclusive access, zero hassle.',
  ctaLabel = 'Explore All Tours',
  ctaHref = '/tours',
  media,
  className
}: ImageCtaBannerProps) {
  return (
    <section className={cn('relative isolate mt-20 overflow-hidden lg:mt-28', className)}>
      <div className="absolute inset-0">
        <SafeImage src={media.src} alt={media.alt} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-[#0a0a0a]/60" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center sm:py-32"
      >
        <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-[0.32em] text-apex-300">
          {eyebrow}
        </motion.p>
        <motion.h2 variants={fadeInUp} className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          {titlePrefix}
          <span className="bg-gradient-to-r from-apex-300 via-sky-300 to-apex-200 bg-clip-text text-transparent">
            {highlight}
          </span>
        </motion.h2>
        <motion.p variants={fadeInUp} className="mt-5 max-w-xl text-slate-300">
          {subtitle}
        </motion.p>
        <motion.div variants={fadeInUp}>
          <Link
            href={ctaHref}
            className="cursor-hover mt-8 inline-flex items-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition hover:scale-105 hover:bg-apex-400"
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
