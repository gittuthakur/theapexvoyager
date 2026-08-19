'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, Sparkles } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { TravelStyleField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { experienceTypes } from '@/config/experiences.config';
import { images } from '@/config/images.config';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { ExperienceRegion, ExperienceSeason } from '@/types/experience';

const REGIONS: ExperienceRegion[] = ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand'];
const SEASONS: ExperienceSeason[] = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'];

export default function ExperiencesHero() {
  const router = useRouter();
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [season, setSeason] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (category) params.set('category', category);
    if (season) params.set('season', season);
    const qs = params.toString();
    router.push(`/experiences${qs ? `?${qs}` : ''}#listing`);
  }

  return (
    <section className="relative isolate overflow-hidden bg-slate-900">
      <div className="absolute inset-0">
        <SafeImage src={images.hero} alt="Himalayan peaks at first light" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/50" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative mx-auto flex w-full max-w-[1400px] flex-col justify-end px-6 pb-28 pt-32"
      >
        <motion.p variants={fadeInUp} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-apex-600">
          <Sparkles size={14} />
          Curated Himalayan Experiences
        </motion.p>
        <motion.h1 variants={fadeInUp} className="flex flex-col text-4xl font-bold text-slate-900 sm:text-5xl mt-3">
          Do More Than Visit.
          <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent"> Experience the Himalayas.</span>
        </motion.h1>
        <motion.p variants={fadeInUp} className="mt-5 max-w-7xl text-lg text-slate-600">
          From high-altitude adventures and village life to soulful retreats and unforgettable local experiences — discover the Himalayas beyond the usual
          itinerary.
        </motion.p>
      </motion.div>

      {/* Discovery bar — deliberately overlaps the hero's lower edge so it reads as one continuous, premium surface rather than a plain search form below the fold. */}
      <div className="relative mx-auto w-full max-w-[1400px] px-6 sm:mb-10">
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          onSubmit={handleSubmit}
          className={cn(SEARCH_PANEL_CLASS, 'relative -mt-16 mb-10 flex w-full flex-col gap-2 sm:mb-0 lg:flex-row lg:items-center lg:gap-3')}
        >
          <div className="grid flex-1 gap-2 lg:grid-cols-3 lg:items-center lg:gap-3">
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <TravelStyleField value={region} onChange={setRegion} styles={REGIONS} label="Where" icon={MapPin} placeholder="Any region" />
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <TravelStyleField
                value={category}
                onChange={setCategory}
                styles={experienceTypes}
                label="What are you looking for?"
                icon={Sparkles}
                placeholder="Any experience"
              />
            </motion.div>

            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <TravelStyleField value={season} onChange={setSeason} styles={SEASONS} label="When" icon={Calendar} placeholder="Any season" />
            </motion.div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-hover inline-flex items-center justify-center gap-2 rounded-xl bg-apex-500 px-6 py-4 font-semibold text-white shadow-lg shadow-apex-500/30 transition-colors duration-300 ease-in-out hover:bg-apex-400 lg:py-5"
          >
            <Search size={18} />
            Search Experiences
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}
