import { NextResponse } from 'next/server';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { getPackagesByDestinationSlug } from '@/lib/packages';
import { getToursByDestinationSlug } from '@/lib/tours';
import { getExperiencesByDestination } from '@/lib/experiences';
import { getExpertsByDestinationSlug } from '@/lib/experts';
import { getHotels } from '@/lib/hotels';

// GET /api/destinations/[slug] -> the destination "graph": the curated destination
// record plus everything else site-wide that relates to it (tours, journeys,
// experiences, local experts, and a best-effort stays summary). Each related
// collection is looked up by matching field (slug/free-text), not a literal Mongo
// relation — see the architecture note in the project plan for why that's the right
// call here.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = getCuratedDestinationBySlug(slug);

  if (!destination) {
    return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
  }

  const journeys = await getPackagesByDestinationSlug(destination.slug);
  const tours = await getToursByDestinationSlug(destination.slug);
  const experiences = getExperiencesByDestination(destination.title);
  const experts = await getExpertsByDestinationSlug(destination.slug);

  // Hotel reads go through MongoDB and have no built-in fallback — this endpoint
  // degrades to an empty stays summary rather than failing the whole graph response.
  let stays: { count: number; fromPrice: number | null } = { count: 0, fromPrice: null };
  try {
    const hotels = await getHotels({ destination: destination.title });
    stays = {
      count: hotels.length,
      fromPrice: hotels.length > 0 ? Math.min(...hotels.map((hotel) => hotel.pricePerNight)) : null
    };
  } catch (error) {
    console.error(`Failed to load stays for destination graph (${destination.slug})`, error);
  }

  return NextResponse.json({
    destination,
    journeys,
    tours,
    experiences,
    experts,
    stays
  });
}
