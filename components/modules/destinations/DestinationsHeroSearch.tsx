'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Search } from 'lucide-react';
import { DestinationField, TravelStyleField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { Button } from '@/components/ui';
import { travelStyles } from '@/config/travelStyles.config';
import { cn } from '@/lib/utils';

export interface DestinationsHeroSearchProps {
  initialDestination?: string;
  initialStyle?: string;
}

const STYLE_LABELS = travelStyles.map((style) => style.label);

// Rendered as InnerHeroBanner's children on /destinations. Reuses the exact
// DestinationField/TravelStyleField components (and the `destination`/`style` query
// param names) that BookingWidget's "Destinations" tab already uses site-wide, so
// this hero's Explore button lands on the same /destinations?destination=&style=
// URL shape every other deep link into this page already relies on.
export default function DestinationsHeroSearch({ initialDestination = '', initialStyle = '' }: DestinationsHeroSearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [style, setStyle] = useState(initialStyle);

  function handleExplore() {
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (style.trim()) params.set('style', style.trim());
    const qs = params.toString();
    router.push(qs ? `/destinations?${qs}` : '/destinations');
  }

  return (
    <div className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-3 sm:flex-row sm:items-stretch')}>
      <div className="flex-1">
        <DestinationField value={destination} onChange={setDestination} label="Where to?" icon={Search} placeholder="Search places or destinations" />
      </div>
      <div className="flex-1">
        <TravelStyleField value={style} onChange={setStyle} styles={STYLE_LABELS} placeholder="Travel style" />
      </div>
      <Button type="button" onClick={handleExplore} className="shrink-0" size='lg'>
        <Compass size={22} aria-hidden="true" />
        Explore Places
      </Button>
    </div>
  );
}
