import type { ReactNode } from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';

export interface DetailHeroProps {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  breadcrumb?: ReactNode;
  /** A row of metadata (icon+text pairs, badges, link pills, ...) — each page composes
   *  its own content here; DetailHero only supplies the shared row layout/spacing. */
  meta?: ReactNode;
  /** Page-relevant CTA(s) only — omit entirely where the page's real CTA already lives
   *  elsewhere (e.g. a sticky booking sidebar). */
  actions?: ReactNode;
  imageSizes?: string;
  className?: string;
}

/**
 * The one shared image-led hero for every internal detail page (Destination, Region,
 * Journey, Stay, Experience, Expert) — rounded-[2rem], dark gradient overlay, one shared
 * height range, single stacked content column (eyebrow → title → subtitle → meta →
 * actions) so pages with longer metadata/CTA content never collide with a fixed-ratio
 * two-column grid. Each page supplies its own eyebrow/title/subtitle/meta/actions — the
 * visual language is shared, the content and CTAs are not.
 *
 * Relies on components/layout/Navbar.tsx's HERO_ROUTES exact-matching only bare listing
 * paths (e.g. `/destinations`, never `/destinations/manali`) so this hero always renders
 * below a normal solid navbar with no transparency/offset wiring needed here — if
 * HERO_ROUTES ever becomes prefix-based, re-check this.
 */
export default function DetailHero({
  image,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  breadcrumb,
  meta,
  actions,
  imageSizes = '100vw',
  className
}: DetailHeroProps) {
  return (
    <section className={cn('relative isolate overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900', className)}>
      <div className="absolute inset-0">
        <SafeImage src={image} alt={imageAlt} fill priority sizes={imageSizes} className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/10" />
      </div>

      <div className="relative flex min-h-[430px] flex-col justify-end gap-3 px-6 py-8 text-white sm:h-[460px] sm:px-10 sm:py-10 lg:h-[500px] lg:py-12">
        {breadcrumb}
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-300">{eyebrow}</p> : null}
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
        {subtitle ? <p className="max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{subtitle}</p> : null}
        {meta ? <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">{meta}</div> : null}
        {actions ? <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div> : null}
      </div>
    </section>
  );
}
