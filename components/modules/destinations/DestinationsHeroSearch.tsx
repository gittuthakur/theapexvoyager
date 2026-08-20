'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Search } from 'lucide-react';
import { DestinationField, TravelStyleField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { Button } from '@/components/ui';
import { travelStyles } from '@/config/travelStyles.config';
import { destinations as curatedDestinations } from '@/config/destinations.config';
import { cn } from '@/lib/utils';

export interface DestinationsHeroSearchProps {
  initialDestination?: string;
  initialStyle?: string;
}

const STYLE_LABELS = travelStyles.map((style) => style.label);
// The real destination catalog (not a hand-picked "trending" subset) — so this search
// actually covers every published destination, not just the 8 names in
// config/search.config.ts's trendingDestinations (that shorter list is fine for other
// booking-search contexts like Transport/Stays quick-picks, just not for this one).
const DESTINATION_TITLES = curatedDestinations.map((destination) => destination.title);
const SLUG_BY_TITLE = new Map(curatedDestinations.map((destination) => [destination.title, destination.slug]));

// Rendered as InnerHeroBanner's children on /destinations. Reuses the exact
// DestinationField/TravelStyleField components (and the `destination`/`style` query
// param names) that BookingWidget's "Destinations" tab already uses site-wide, so
// this hero's Explore button lands on the same /destinations?destination=&style=
// URL shape every other deep link into this page already relies on.
export default function DestinationsHeroSearch({ initialDestination = '', initialStyle = '' }: DestinationsHeroSearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [style, setStyle] = useState(initialStyle);

  // Both fields are independent local state — picking a WHERE TO or TRAVEL STYLE option
  // only updates that field, it never navigates on its own. Explore Place is the single
  // navigation trigger, once both are filled in.
  const canExplore = Boolean(destination.trim()) && Boolean(style.trim());

  function handleExplore() {
    if (!canExplore) return;

    const trimmedDestination = destination.trim();
    const trimmedStyle = style.trim();
    const slug = SLUG_BY_TITLE.get(trimmedDestination);

    if (slug) {
      // A real, known destination — go straight to its own page, carrying the chosen
      // travel style forward as context.
      router.push(`/destinations/${slug}?style=${encodeURIComponent(trimmedStyle)}`);
      return;
    }

    // Free text that isn't an exact known destination name — same filtered-listing
    // fallback this button already used before WHERE TO gained direct-navigation.
    const params = new URLSearchParams();
    params.set('destination', trimmedDestination);
    params.set('style', trimmedStyle);
    router.push(`/destinations?${params.toString()}`);
  }

  return (
    <div className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-3 sm:flex-row sm:items-stretch')}>
      <div className="flex-1">
        <DestinationField
          value={destination}
          onChange={setDestination}
          destinations={DESTINATION_TITLES}
          label="Where to?"
          icon={Search}
          placeholder="Search places or destinations"
        />
      </div>
      <div className="flex-1">
        <TravelStyleField value={style} onChange={setStyle} styles={STYLE_LABELS} placeholder="Travel style" />
      </div>
      <Button type="button" onClick={handleExplore} disabled={!canExplore} className="shrink-0" size='lg'>
        <Compass size={22} aria-hidden="true" />
        Explore Places
      </Button>
    </div>
  );
}
