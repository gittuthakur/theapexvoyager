import { Star } from 'lucide-react';
import DetailHero from '@/components/modules/detail/DetailHero';
import DestinationPlanJourneyButton from '@/components/modules/DestinationPlanJourneyButton';
import WhatsAppEnquireButton from '@/components/modules/WhatsAppEnquireButton';
import type { Destination } from '@/types/destination';
import type { DestinationRating } from '@/lib/reviews';

export interface DestinationHeroProps {
  destination: Destination;
  rating?: DestinationRating;
}

// Thin adapter over the shared DetailHero — maps the already-fetched destination (and
// its real computed rating) onto the hero's props. Previously a white info card with a
// title/description block followed by a separate, un-overlaid image; now the same
// image-led hero language as Region/Journey, with no destination-specific data removed.
export default function DestinationHero({ destination, rating }: DestinationHeroProps) {
  return (
    <DetailHero
      image={destination.image}
      imageAlt={`${destination.title}, ${destination.state ?? 'Himalayas'}`}
      imageSizes="(min-width: 1024px) 1200px, 100vw"
      eyebrow={destination.region ?? destination.category}
      title={destination.title}
      subtitle={destination.description}
      meta={
        <>
          {rating ? (
            <span className="inline-flex items-center gap-2">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {rating.rating.toFixed(1)}
              <span className="text-white/60"> ({rating.count} review{rating.count === 1 ? '' : 's'})</span>
            </span>
          ) : null}
          {destination.travelStyles?.slice(0, 3).map((style) => (
            <span key={style} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {style}
            </span>
          ))}
        </>
      }
      actions={
        <>
          <DestinationPlanJourneyButton destinationTitle={destination.title} destinationSlug={destination.slug} />
          <WhatsAppEnquireButton selection={{ name: destination.title, type: 'destination', slug: destination.slug }} label="Enquire on WhatsApp" />
        </>
      }
    />
  );
}
