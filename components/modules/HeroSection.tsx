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
  /** Optional right-side card (e.g. the homepage's "Three Himalayan States" panel). */
  sidePanel?: ReactNode;
  /** Optional full-width row rendered below the two-column content, e.g. a search bar. */
  searchBar?: ReactNode;
  /** Overrides the default dark-bottom gradient overlay. Defaults to the current site-wide look. */
  overlayClassName?: string;
  /**
   * 'light' (default) is the current site-wide look: dark text over a light wash, safe
   * against any bright/washed-out image. 'dark' pairs a cinematic dark overlay with light
   * text — use only when `overlayClassName` actually darkens the area the text sits over
   * (e.g. the left side, for a left-to-right fade), otherwise light text loses contrast.
   */
  variant?: 'light' | 'dark';
}

export default function HeroSection({ data, className, children, sidePanel, searchBar, overlayClassName, variant = 'light' }: HeroSectionProps) {
  const isDark = variant === 'dark';
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
    <section aria-labelledby="hero-heading" className={cn('relative isolate overflow-hidden bg-slate-100', className)}>
      {data.schema ? <JsonLd data={data.schema} /> : null}

      {/* fill + sizes (not fixed width/height) keeps this full-bleed background sharp and CLS-free across breakpoints */}
      <div className="absolute inset-0">
        <SafeImage src={data.media.src} alt={data.media.alt} fill priority sizes="100vw" className="object-cover" />
        <div className={cn('absolute inset-0 bg-gradient-to-b from-white/85 via-white/0 to-[#0D1830]/35', overlayClassName)} />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative mx-auto grid max-w-[1440px] gap-4 px-6 pb-10 pt-28 lg:px-8 xl:px-5 lg:grid-cols-[2.6fr_1fr] lg:items-center lg:pb-18 lg:pt-28"
      >
        <div>
          <header className={cn(
            isDark ? 'space-y-0' : 'space-y-3'
          )}>
            <motion.p
              variants={fadeInUp}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-md shadow-sm',
                isDark ? 'p-0 border-0 text-sm font-semibold uppercase tracking-[0.20em] text-apex-600 shadow-none' : 'border-slate-200 bg-white/70 text-slate-700'
              )}
            >
              <span className={cn('inline-flex h-6 w-6 items-center justify-center', isDark ? 'hidden' : 'text-apex-600')}>
                {renderBadgeIcon()}
              </span>
              {data.badge.text}
            </motion.p>

            <motion.h1
              id="hero-heading"
              variants={fadeInUp}
              className={cn('mt-6 text-3xl font-extrabold tracking-normal text-base/[1.5] lg:text-5xl', isDark ? 'text-slate-900' : 'text-slate-900')}
            >
              <span className="block leading-[1.25]">{data.titleTop}</span>
              <span className="block leading-[1.25]">
                {data.titleBottomPrefix}
                <span
                  className={cn(
                    'bg-gradient-to-r bg-clip-text text-transparent',
                    isDark ? 'bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent' : 'from-apex-500 via-apex-600 to-apex-700'
                  )}
                >
                  {data.titleHighlight}
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className={cn(
                'max-w-4xl sm:text-xl text-shadow-sm px-3 py-2 rounded-xl',
                isDark ? '' : 'text-slate-900 bg-white/10 backdrop-blur-sm'
              )}
            >
              {data.subtitle}
            </motion.p>
          </header>

          {children ? (
            <motion.div variants={fadeInUp} className="mt-8 space-y-4">
              {children}
            </motion.div>
          ) : null}
        </div>

        {sidePanel ? (
          <motion.div variants={fadeInUp} className="lg:justify-self-end lg:self-start">
            {sidePanel}
          </motion.div>
        ) : null}

        {searchBar ? (
          <motion.div variants={fadeInUp} className="mt-4 lg:col-span-2 lg:mt-3">
            {searchBar}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
