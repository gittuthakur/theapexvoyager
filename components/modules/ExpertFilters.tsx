import { getCuratedDestinationBySlug } from '@/lib/destinations';
import ExpertsHeroSearch from '@/components/modules/experts/ExpertsHeroSearch';
import type { ExpertFacets } from '@/types/expert';

export interface ExpertFiltersProps {
  facets: ExpertFacets;
  destination?: string;
  travelStyle?: string;
  expertise?: string;
  q?: string;
}

// Resolves the real facet slugs/values into the {value, display} pairs the Hero
// search fields need (see lib/experts.ts's getExpertFacets) — a filter option only
// ever appears if an expert actually covers it. This stays a server component so
// that lookup (destination slug -> title) never ships to the client; the actual
// field UI/interaction lives in the client ExpertsHeroSearch.
export default async function ExpertFilters({ facets, destination, travelStyle, expertise, q }: ExpertFiltersProps) {
  const destinationOptions = (
    await Promise.all(
      facets.destinations.map(async (slug) => ({ value: slug, display: (await getCuratedDestinationBySlug(slug))?.title ?? slug }))
    )
  ).filter((option) => option.display);

  const travelStyleOptions = facets.travelStyles.map((style) => ({ value: style, display: style }));
  const expertiseOptions = facets.expertise.map((item) => ({ value: item, display: item }));

  return (
    <ExpertsHeroSearch
      destinationOptions={destinationOptions}
      travelStyleOptions={travelStyleOptions}
      expertiseOptions={expertiseOptions}
      initialQuery={q}
      initialDestination={destination}
      initialTravelStyle={travelStyle}
      initialExpertise={expertise}
    />
  );
}
