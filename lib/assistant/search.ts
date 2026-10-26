import { parsePackageDurationDays } from '@/lib/packageFilters';
import type { TravelPackage } from '@/types/package';
import type { SearchCriteria } from '@/lib/assistant/schema';

// Words that describe the kind of product rather than a place; matching on them would return everything.
const STOP_WORDS = new Set([
  'tour', 'tours', 'trip', 'trips', 'package', 'packages', 'journey', 'journeys', 'holiday', 'holidays',
  'vacation', 'india', 'the', 'and', 'for', 'with', 'from', 'near', 'around', 'best', 'any', 'some'
]);

const NIGHT_TOLERANCE = 1;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function haystack(pkg: TravelPackage): string {
  return [pkg.name, pkg.destination, pkg.category, (pkg.destinationSlugs ?? []).join(' ').replace(/-/g, ' '), (pkg.highlights ?? []).join(' ')]
    .join(' ')
    .toLowerCase();
}

/**
 * Pure filter/rank over packages already read through lib/packages.ts (published Journeys only). Never relaxes a
 * constraint on its own: if nothing matches, nothing is returned and the caller offers an enquiry instead.
 *  - destination: any meaningful word must appear in the name, destination, category, destination slugs or highlights
 *  - nights: the package's nights (days - 1) must be within the requested range, give or take one night
 *  - budget: the package's starting price per person must not exceed the budget
 * Travellers and month are deliberately not filters: price is per person, and no package carries verified
 * availability, so both are passed on to the enquiry instead of pretending to be checked here.
 */
export function searchJourneys(packages: readonly TravelPackage[], criteria: SearchCriteria, limit = 3): TravelPackage[] {
  const wanted = criteria.destination ? tokens(criteria.destination) : [];
  const ranked: { pkg: TravelPackage; score: number; index: number }[] = [];

  packages.forEach((pkg, index) => {
    let score = 0;
    if (wanted.length) {
      const text = haystack(pkg);
      score = wanted.filter((token) => text.includes(token)).length;
      if (score === 0) return;
    }
    if (criteria.nightsMin !== undefined || criteria.nightsMax !== undefined) {
      const days = parsePackageDurationDays(pkg.duration);
      if (days === undefined) return;
      const nights = days - 1;
      const low = (criteria.nightsMin ?? criteria.nightsMax!) - NIGHT_TOLERANCE;
      const high = (criteria.nightsMax ?? criteria.nightsMin!) + NIGHT_TOLERANCE;
      if (nights < low || nights > high) return;
    }
    if (criteria.budgetPerPerson !== undefined && !(pkg.price <= criteria.budgetPerPerson)) return;
    ranked.push({ pkg, score, index });
  });

  return ranked
    .sort((a, b) => b.score - a.score || Number(Boolean(b.pkg.featured)) - Number(Boolean(a.pkg.featured)) || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.pkg);
}
