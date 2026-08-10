'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import JsonLd from '@/components/seo/JsonLd';
import { SafeImage } from '@/components/ui/SafeImage';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface HeroBadge {
  icon?: ReactNode;
  text: string;
}

export interface HeroMedia {
  src: string;
  alt: string;
}

export interface HeroSectionData {
  badge: HeroBadge;
  titleTop: string;
  titleBottomPrefix: string;
  titleHighlight: string;
  subtitle: string;
  media: HeroMedia;
  /** Pre-built JSON-LD payload (e.g. from lib/schema.ts) rendered alongside the hero markup. */
  schema?: Record<string, unknown>;
}

export interface HeroSectionProps {
  data: HeroSectionData;
  className?: string;
  children?: ReactNode;
}

export default function HeroSection({ data, className, children }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-heading" className={cn('relative isolate overflow-hidden bg-[#0a0a0a]', className)}>
      {data.schema ? <JsonLd data={data.schema} /> : null}

      {/* fill + sizes (not fixed width/height) keeps this full-bleed background sharp and CLS-free across breakpoints */}
      <div className="absolute inset-0">
        <SafeImage src={data.media.src} alt={data.media.alt} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/85 via-[#0a0a0a]/45 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[#0a0a0a]/25" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative mx-auto max-w-7xl px-6 pt-28 pb-16 sm:px-10 sm:pt-32 lg:px-16 lg:pt-36 lg:pb-20"
      >
        <header>
          <motion.p
            variants={fadeInUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-slate-200 backdrop-blur-sm"
          >
            {data.badge.icon}
            {data.badge.text}
          </motion.p>

          <motion.h1
            id="hero-heading"
            variants={fadeInUp}
            className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            <span className="block">{data.titleTop}</span>
            <span className="block">
              {data.titleBottomPrefix}
              <span className="bg-gradient-to-r from-apex-300 via-sky-300 to-apex-200 bg-clip-text text-transparent">
                {data.titleHighlight}
              </span>
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            {data.subtitle}
          </motion.p>
        </header>

        {children ? (
          <motion.div variants={fadeInUp} className="mt-10 space-y-4">
            {children}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
