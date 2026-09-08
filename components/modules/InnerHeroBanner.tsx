'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SafeImage } from '@/components/ui/SafeImage';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface InnerHeroBannerProps {
  title: string;
  highlite: string;
  subtitle?: string;
  eyebrow?: string;
  bgImage: string;
  className?: string;
  /** Extra classes merged onto the background image itself (e.g. a custom object-position) — defaults to plain object-cover so every existing caller is unaffected. */
  imageClassName?: string;
  children?: ReactNode;
}

// Drop this at the very top of a page, right after the (sticky, in-flow) Navbar —
// no special top padding or header-transparency wiring needed anymore, since the
// header no longer floats over hero content in the light theme.
export default function InnerHeroBanner({ title, highlite, subtitle, eyebrow, bgImage, className, imageClassName, children }: InnerHeroBannerProps) {
  return (
    <section className={cn('relative isolate flex min-h-[380px] items-end overflow-hidden bg-slate-100 sm:min-h-[520px]', className)}>
      <div className="absolute inset-0">
        {/* Decorative: the H1 right below already carries this hero's actual content
            (previously alt={title} silently dropped `highlite`, e.g. rendering as the
            truncated "Places Worth" on /destinations instead of the full heading). */}
        <SafeImage src={bgImage} alt="" fill priority sizes="100vw" className={cn('object-cover', imageClassName)} />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-white/80" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative mx-auto w-full max-w-[1440px] px-6 pb-12 pt-32"
      >
        <section className="">
          {eyebrow ? (
            <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-[0.20em] text-apex-600">
              {eyebrow}
            </motion.p>
          ) : null}
          <motion.h1 variants={fadeInUp} className={cn('text-4xl font-bold text-slate-900 sm:text-5xl', eyebrow && 'mt-3')}>
            {title} <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{highlite}</span>
          </motion.h1>
          {subtitle ? (
            <motion.p variants={fadeInUp} className="mt-3 text-lg text-slate-800">
              {subtitle}
            </motion.p>
          ) : null}
          {children ? (
            <motion.div variants={fadeInUp} className="mt-8">
              {children}
            </motion.div>
          ) : null}
        </section>
      </motion.div>
    </section>
  );
}
