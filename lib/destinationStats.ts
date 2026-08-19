import { getAllPackages } from '@/lib/packages';
import { getHotels } from '@/lib/hotels';
import { getExperiencesByDestination } from '@/lib/experiences';
import type { Destination, DestinationStats } from '@/types';

/**
 * Computes journey/stay/experience counts (and a real starting price, only when one
 * exists) for a whole destinations listing in one batched pass — fetches each source
 * ONCE regardless of destination count, then filters in memory per destination,
 * instead of calling getPackagesByDestinationSlug()/getHotels({destination}) N times
 * (which would each redundantly re-fetch the full underlying collection).
 *
 * stayCount reuses the same title-substring-against-`location` match already used in
 * app/api/destinations/[slug]/route.ts — Hotel has no destinationSlug field today,
 * which is a known weak link in the data model, not something this pass fixes.
 *
 * Each data source degrades independently to an empty list on failure so one bad
 * source never blocks the whole page from rendering.
 */
export async function getDestinationStatsMap(destinations: Destination[]): Promise<Map<string, DestinationStats>> {
  const [packages, hotels] = await Promise.all([
    getAllPackages().catch((error) => {
      console.error('Failed to load journeys for destination stats', error);
      return [];
    }),
    getHotels().catch((error) => {
      console.error('Failed to load hotels for destination stats', error);
      return [];
    })
  ]);

  const statsMap = new Map<string, DestinationStats>();

  for (const destination of destinations) {
    const matchingPackages = packages.filter((pkg) => pkg.destinationSlugs?.includes(destination.slug));
    const startingPrice = matchingPackages.length > 0 ? Math.min(...matchingPackages.map((pkg) => pkg.price)) : undefined;

    const needle = destination.title.trim().toLowerCase();
    const stayCount = needle ? hotels.filter((hotel) => hotel.location.toLowerCase().includes(needle)).length : 0;

    const experienceCount = getExperiencesByDestination(destination.title).length;

    statsMap.set(destination.slug, {
      journeyCount: matchingPackages.length,
      stayCount,
      experienceCount,
      startingPrice
    });
  }

  return statsMap;
}
