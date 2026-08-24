'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, Compass, MapPin, Search } from 'lucide-react';
import { TravelStyleField, SEARCH_PANEL_CLASS, SEARCH_FIELD_CLASS } from '@/components/modules/search';
import { cn } from '@/lib/utils';

export interface ExpertOption {
  value: string;
  display: string;
}

export interface ExpertsHeroSearchProps {
  destinationOptions: ExpertOption[];
  travelStyleOptions: ExpertOption[];
  expertiseOptions: ExpertOption[];
  initialQuery?: string;
  initialDestination?: string;
  initialTravelStyle?: string;
  initialExpertise?: string;
}

/**
 * Field-block styled Hero search for /experts — same SEARCH_PANEL_CLASS shell and
 * SEARCH_FIELD_CLASS/TravelStyleField field language as StaysHeroSearch/ExperiencesHero,
 * replacing the old pill-row filter presentation. Submits to the exact same
 * /experts?destination=&travelStyle=&expertise=&q= query-param contract the results
 * page already reads — only the on-screen field presentation changed, not the URL
 * shape or the underlying facet data.
 */
export default function ExpertsHeroSearch({
  destinationOptions,
  travelStyleOptions,
  expertiseOptions,
  initialQuery = '',
  initialDestination = '',
  initialTravelStyle = '',
  initialExpertise = ''
}: ExpertsHeroSearchProps) {
  const router = useRouter();

  // Destination's URL value is a slug while its field displays the human-readable
  // title — every other field's URL value already equals its display string.
  const destinationDisplayByValue = useMemo(() => new Map(destinationOptions.map((option) => [option.value, option.display])), [destinationOptions]);
  const destinationValueByDisplay = useMemo(() => new Map(destinationOptions.map((option) => [option.display, option.value])), [destinationOptions]);

  const [query, setQuery] = useState(initialQuery);
  const [destinationDisplay, setDestinationDisplay] = useState(destinationDisplayByValue.get(initialDestination) ?? '');
  const [travelStyle, setTravelStyle] = useState(initialTravelStyle);
  const [expertise, setExpertise] = useState(initialExpertise);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const destinationValue = destinationValueByDisplay.get(destinationDisplay);
    if (destinationValue) params.set('destination', destinationValue);
    if (travelStyle) params.set('travelStyle', travelStyle);
    if (expertise) params.set('expertise', expertise);
    const qs = params.toString();
    router.push(qs ? `/experts?${qs}` : '/experts');
  }

  return (
    <form onSubmit={handleSubmit} className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-2 xl:flex-row xl:items-center xl:gap-3')}>
      <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:items-center xl:gap-3">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <label className={SEARCH_FIELD_CLASS}>
            <Search size={18} className="shrink-0 text-apex-500" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Search Expert / Specialty</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. Spiti, honeymoon, road trips…"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
              />
            </span>
          </label>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <TravelStyleField
            value={destinationDisplay}
            onChange={setDestinationDisplay}
            styles={destinationOptions.map((option) => option.display)}
            label="Destination"
            icon={MapPin}
            placeholder="Any destination"
          />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <TravelStyleField
            value={travelStyle}
            onChange={setTravelStyle}
            styles={travelStyleOptions.map((option) => option.display)}
            label="Travel Style"
            icon={Compass}
            placeholder="Any style"
          />
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <TravelStyleField
            value={expertise}
            onChange={setExpertise}
            styles={expertiseOptions.map((option) => option.display)}
            label="Expertise"
            icon={Award}
            placeholder="Any expertise"
          />
        </motion.div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-hover inline-flex items-center justify-center gap-2 rounded-xl bg-apex-500 px-6 py-4 font-semibold text-white shadow-lg shadow-apex-500/30 transition-colors duration-300 ease-in-out hover:bg-apex-400 xl:py-5"
      >
        <Search size={18} />
        Search Experts
      </motion.button>
    </form>
  );
}
