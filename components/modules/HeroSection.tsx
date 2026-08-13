"use client";

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
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
  const renderBadgeIcon = () => {
    const icon = data.badge.icon;
    if (React.isValidElement(icon)) {
      const el = icon as React.ReactElement<any, any>;
      const existingClass = (el.props && (el.props as any).className) || '';
      return React.cloneElement(el, { ...(el.props as any), className: `${existingClass} h-5 w-5`, ['aria-hidden']: true } as any);
    }
    return icon;
  };

  return (
    <section aria-labelledby="hero-heading" className={cn('relative isolate overflow-hidden bg-[#0a0a0a]', className)}>
      {data.schema ? <JsonLd data={data.schema} /> : null}

      {/* fill + sizes (not fixed width/height) keeps this full-bleed background sharp and CLS-free across breakpoints */}
      <div className="absolute inset-0">
        <SafeImage src={data.media.src} alt={data.media.alt} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080E1E]/100 via-[#080E1E]/45 to-[#080E1E]/0" />
        <div className="absolute inset-0 bg-[#000]/15" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative mx-auto max-w-[1440px] px-6 pt-28 pb-16 sm:pt-32 xxl:px-0 lg:pt-36 lg:pb-20"
      >
        <header className="space-y-2">
          <motion.p
            variants={fadeInUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-2.5 text-md text-slate-200"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center text-apex-300">
              {renderBadgeIcon()}
            </span>
            {data.badge.text}
          </motion.p>

          <motion.h1
            id="hero-heading"
            variants={fadeInUp}
            className="mt-6 text-4xl font-bold tracking-normal text-base/[1.75] text-white lg:text-7xl"
          >
            <span className="block leading-[1.25]">{data.titleTop}</span>
            <span className="block leading-[1.25]">
              {data.titleBottomPrefix}
              <span className="bg-gradient-to-r from-[#60A5FA]/100 via-[#38BDF8]/100 to-[#67E8F9]/100 bg-clip-text text-transparent">
                {data.titleHighlight}
              </span>
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="max-w-4xl text-base leading-7 text-slate-300 sm:text-2xl">
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
