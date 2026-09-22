import { Clock, MapPin } from 'lucide-react';
import DetailHero from '@/components/modules/detail/DetailHero';
import { DetailMetaItem } from '@/components/modules/detail/DetailMeta';
import type { TravelPackage } from '@/types/package';

export interface JourneyHeroProps {
  pkg: TravelPackage;
  /** SEO-driven H1 override for a specific journey (e.g. "Manali Tour Package from
   *  Chandigarh") — falls back to the journey's own `name` for every journey that
   *  doesn't set one, so card titles/breadcrumbs/`name` itself stay untouched. */
  titleOverride?: string;
}

// Thin adapter over the shared DetailHero — same external { pkg } prop contract as
// before. Back navigation now lives in PackageDetailContent, above this hero, matching
// every other detail page's plain-text treatment (previously overlaid inside the image
// with a frosted-pill style unique to this route).
export default function JourneyHero({ pkg, titleOverride }: JourneyHeroProps) {
  return (
    <DetailHero
      image={pkg.image}
      imageAlt={pkg.name}
      imageSizes="(min-width: 1024px) 1200px, 100vw"
      eyebrow={pkg.category}
      title={titleOverride ?? pkg.name}
      meta={
        <>
          <DetailMetaItem icon={MapPin}>{pkg.destination}</DetailMetaItem>
          <DetailMetaItem icon={Clock}>{pkg.duration}</DetailMetaItem>
        </>
      }
    />
  );
}
