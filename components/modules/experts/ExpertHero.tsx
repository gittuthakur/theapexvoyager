import Link from 'next/link';
import { MapPin } from 'lucide-react';
import DetailHero from '@/components/modules/detail/DetailHero';
import ExpertTalkButton from '@/components/modules/ExpertTalkButton';
import type { TravelExpert } from '@/types/expert';
import type { Destination } from '@/types/destination';

export interface ExpertHeroProps {
  expert: TravelExpert;
  destinations: Destination[];
}

// Thin adapter over the shared DetailHero. Previously a plain white-card title block
// followed by a separate, un-overlaid profile image; now the same image-led hero
// language as Region/Journey/Destination/Stay/Experience. "Talk to Expert" moves into
// the hero's actions slot, matching Region's pattern for a page-relevant hero CTA.
export default function ExpertHero({ expert, destinations }: ExpertHeroProps) {
  return (
    <DetailHero
      image={expert.profileImage}
      imageAlt={expert.name}
      imageSizes="(min-width: 1024px) 1200px, 100vw"
      eyebrow={expert.role}
      title={expert.name}
      meta={
        destinations.length > 0
          ? destinations.slice(0, 4).map((destination) => (
              <Link
                key={destination.slug}
                href={`/destinations/${destination.slug}`}
                className="cursor-hover inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-white/25"
              >
                <MapPin size={13} />
                {destination.title}
              </Link>
            ))
          : null
      }
      actions={<ExpertTalkButton expert={expert} />}
    />
  );
}
