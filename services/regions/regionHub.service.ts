import { connectDB } from '@/lib/mongodb';
import { Region, type RegionDocument } from '@/models/Region';
import { Destination, type DestinationDocument } from '@/models/Destination';
import { Journey, type JourneyDocument } from '@/models/Journey';
import { Tour, type TourDocument } from '@/models/Tour';
import { Hotel, type HotelDocument } from '@/models/Hotel';
import { Experience, type ExperienceDocument } from '@/models/Experience';
import { TransportRoute, type TransportRouteDocument } from '@/models/TransportRoute';
import { TransportVehicle, type TransportVehicleDocument } from '@/models/TransportVehicle';
import { Expert, type ExpertDocument } from '@/models/Expert';
import { toDestination } from '@/lib/destinations';
import { toTravelPackage } from '@/lib/packages';
import { toTourPackage } from '@/lib/tours';
import { toHotelPackage } from '@/lib/hotels';
import { toExperience } from '@/lib/experiences';
import { toTransportRoute, toVehicleOption } from '@/lib/transport';
import { toTravelExpert } from '@/lib/experts';
import { getRegionAttractions } from '@/services/providers/google/googlePlaces.attractions';
import { getRegionAccommodations } from '@/services/providers/booking/bookingAccommodation.service';
import type { HomeHeroRegionCard, RegionHubData, RegionProfile } from '@/types/regionHub';

function toRegionProfile(doc: RegionDocument): RegionProfile {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    shortDescription: doc.shortDescription,
    cardImage: doc.cardImage,
    showOnHomeHero: doc.showOnHomeHero,
    hero: doc.hero,
    overview: doc.overview,
    travelGuide: doc.travelGuide,
    seo: doc.seo,
    featured: doc.featured,
    sortOrder: doc.sortOrder,
    status: doc.status,
    createdAt: (doc as unknown as { createdAt: Date }).createdAt?.toISOString?.() ?? '',
    updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt?.toISOString?.() ?? ''
  };
}

/** Lightweight lookup for callers that only need the region profile itself — e.g.
 *  lib/bookingContext.ts's 'region' booking source — without the full Promise.all of
 *  related-catalog queries getRegionHubData runs. */
export async function getRegionProfileBySlug(slug: string): Promise<RegionProfile | undefined> {
  await connectDB();
  const doc = await Region.findOne({ slug, status: 'published' }).lean<RegionDocument | null>();
  return doc ? JSON.parse(JSON.stringify(toRegionProfile(doc))) : undefined;
}

/**
 * The single data-access function backing both app/regions/[slug]/page.tsx (called
 * directly, server-side — never via an internal HTTP self-fetch) and
 * app/api/regions/[slug]/hub/route.ts (for client-side/external consumers). Returns
 * `null` for a missing or unpublished region before running any other query — the
 * caller maps that to notFound() / a 404 response.
 */
export async function getRegionHubData(slug: string): Promise<RegionHubData | null> {
  await connectDB();

  const regionDoc = await Region.findOne({ slug, status: 'published' }).lean<RegionDocument | null>();
  if (!regionDoc) return null;

  const regionObjectId = regionDoc._id;
  const region = toRegionProfile(regionDoc);

  const [destinationDocs, journeyDocs, tourDocs, hotelDocs, experienceDocs, routeDocs, vehicleDocs, expertDocs, googleContext, bookingContext] =
    await Promise.all([
      Destination.find({ regionId: regionObjectId }).sort({ priority: 1 }).lean<DestinationDocument[]>(),
      Journey.find({ regionId: regionObjectId }).sort({ featured: -1, createdAt: 1 }).lean<JourneyDocument[]>(),
      Tour.find({ regionId: regionObjectId }).sort({ featured: -1, createdAt: 1 }).lean<TourDocument[]>(),
      Hotel.find({ regionId: regionObjectId }).sort({ featured: -1, createdAt: 1 }).limit(6).lean<HotelDocument[]>(),
      Experience.find({ regionId: regionObjectId }).sort({ featured: -1 }).lean<ExperienceDocument[]>(),
      TransportRoute.find({ regionId: regionObjectId, active: true }).sort({ featured: -1, createdAt: 1 }).lean<TransportRouteDocument[]>(),
      TransportVehicle.find({ regionIds: regionObjectId, active: true }).sort({ featured: -1, createdAt: 1 }).lean<TransportVehicleDocument[]>(),
      // `publiclyListed: true` required alongside `active` — see models/Expert.ts's field
      // comment (Travel Experts Phase 1 remediation, F2). Without it this query bypassed
      // lib/experts.ts's getAllExperts() gate entirely and kept surfacing the six
      // illustrative placeholder personas on every Region Hub page.
      Expert.find({ regionIds: regionObjectId, active: true, publiclyListed: true }).sort({ featured: -1, createdAt: 1 }).lean<ExpertDocument[]>(),
      getRegionAttractions({ name: region.name }),
      getRegionAccommodations(region.slug)
    ]);

  return JSON.parse(
    JSON.stringify({
      region,
      destinations: destinationDocs.map(toDestination),
      journeys: journeyDocs.map(toTravelPackage),
      tours: tourDocs.map(toTourPackage),
      curatedStays: hotelDocs.map(toHotelPackage),
      experiences: experienceDocs.map(toExperience),
      transportServices: routeDocs.map(toTransportRoute),
      transportVehicles: vehicleDocs.map(toVehicleOption),
      travelExperts: expertDocs.map(toTravelExpert),
      googleContext,
      bookingContext
    })
  );
}

/** Backs the Home Hero's region cards — mapped to the exact `stateLinks` shape the
 *  Home page's existing JSX already renders, so adding a region here requires no
 *  React change. See app/page.tsx. */
export async function getHomeHeroRegions(): Promise<HomeHeroRegionCard[]> {
  await connectDB();
  const docs = await Region.find({ status: 'published', showOnHomeHero: true })
    .sort({ sortOrder: 1 })
    .select('name slug cardImage shortDescription')
    .lean<Pick<RegionDocument, 'name' | 'slug' | 'cardImage' | 'shortDescription'>[]>();

  return docs.map((doc) => ({
    label: doc.name,
    href: `/regions/${doc.slug}`,
    description: doc.shortDescription,
    avatar: doc.cardImage
  }));
}
