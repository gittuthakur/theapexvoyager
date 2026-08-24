import mongoose from 'mongoose';
import { tours } from '../config/tours.config';
import { hotels } from '../config/hotels.config';
import { packages } from '../config/packages.config';
import { travelExperts } from '../config/experts.config';
import { vehicleOptions } from '../config/transport.config';
import { rentalVehicleOptions } from '../config/transportRentals.config';
import { transportRoutes } from '../config/transportRoutes.config';
import { regions } from '../config/regions.config';
import { destinations } from '../config/destinations.config';
import { experiences } from '../config/experiences.config';
import { connectDB } from '../lib/mongodb';
import { Tour } from '../models/Tour';
import { Hotel } from '../models/Hotel';
import { Journey } from '../models/Journey';
import { Expert } from '../models/Expert';
import { TransportVehicle } from '../models/TransportVehicle';
import { TransportRoute } from '../models/TransportRoute';
import { Region } from '../models/Region';
import { Destination } from '../models/Destination';
import { Experience } from '../models/Experience';

// The static `config/regions.config.ts` uses shorter RegionIds ('jammu-kashmir') than
// the URLs this feature exposes (see the plan: /regions/kashmir, matching
// config/tripPlanner.config.ts's PLANNER_REGIONS ids) — this is the one place that
// mapping is made explicit for seeding.
const REGION_SLUG_OVERRIDES: Record<string, string> = {
  'himachal-pradesh': 'himachal-pradesh',
  'jammu-kashmir': 'kashmir',
  uttarakhand: 'uttarakhand'
};

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  await connectDB();

  // Region, Destination and Experience are seeded first — everything else's
  // `regionId` backfill (scripts/backfillRegionRefs.ts) depends on these existing.
  const regionIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const region of regions) {
    const slug = REGION_SLUG_OVERRIDES[region.id] ?? region.id;
    // PLACEHOLDER EDITORIAL COPY — the hero/overview/travelGuide/seo fields below are
    // derived from the existing static `description` so the Region Hub has real,
    // non-fabricated (if generic) copy from day one. Refine before launch; never
    // fabricate statistics, prices or reviews here.
    const doc = await Region.findOneAndUpdate(
      { slug },
      {
        name: region.name,
        slug,
        shortDescription: region.description,
        cardImage: region.image,
        showOnHomeHero: true,
        hero: {
          eyebrow: 'Real Himalayas. Rarely Found.',
          title: region.shortName,
          subtitle: region.description,
          image: region.image
        },
        overview: {
          description: region.description,
          bestSeason: 'October to June',
          idealDuration: '5-10 days',
          startingPoint: region.shortName,
          climate: 'Alpine — cool summers, snowbound winters'
        },
        travelGuide: {
          bestTime: 'October to June, depending on route and altitude',
          howToReach: `Fly or drive into ${region.shortName} — see individual destination pages for specifics.`,
          weather: 'Alpine — cool summers, snowbound winters',
          localTransport: 'Private cabs, shared taxis and local buses connect most towns.'
        },
        seo: {
          title: `${region.name} Travel Guide | The Apex Voyager`,
          description: region.description
        },
        sortOrder: regions.indexOf(region),
        status: 'published'
      },
      { upsert: true, returnDocument: 'after' }
    );
    if (doc) regionIdByName.set(region.name, doc._id);
  }
  console.log(`Seeded ${regions.length} regions into MongoDB.`);

  for (const destination of destinations) {
    const { id, ...rest } = destination;
    const regionId = destination.state ? regionIdByName.get(destination.state) : undefined;
    await Destination.findOneAndUpdate({ slug: destination.slug }, { id, ...rest, regionId }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${destinations.length} destinations into MongoDB.`);

  for (const experience of experiences) {
    const regionId = regionIdByName.get(experience.region);
    await Experience.findOneAndUpdate({ slug: experience.slug }, { ...experience, regionId }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${experiences.length} experiences into MongoDB.`);

  for (const { id, ...tour } of tours) {
    await Tour.findOneAndUpdate({ slug: tour.slug }, tour, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${tours.length} tours into MongoDB.`);

  for (const { id, ...hotel } of hotels) {
    await Hotel.findOneAndUpdate({ slug: hotel.slug }, hotel, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${hotels.length} hotels/homestays into MongoDB.`);

  for (const journey of packages) {
    await Journey.findOneAndUpdate({ slug: journey.slug }, journey, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${packages.length} journeys into MongoDB.`);

  for (const expert of travelExperts) {
    await Expert.findOneAndUpdate({ slug: expert.slug }, expert, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${travelExperts.length} travel experts into MongoDB.`);

  for (const { id, ...vehicle } of vehicleOptions) {
    await TransportVehicle.findOneAndUpdate({ slug: vehicle.slug ?? id }, { ...vehicle, slug: vehicle.slug ?? id }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${vehicleOptions.length} transport vehicles into MongoDB.`);

  for (const { id, ...vehicle } of rentalVehicleOptions) {
    await TransportVehicle.findOneAndUpdate({ slug: vehicle.slug ?? id }, { ...vehicle, slug: vehicle.slug ?? id }, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${rentalVehicleOptions.length} rental transport vehicles into MongoDB.`);

  // Routes have no natural business key like `slug` — {origin, destination} is stable and
  // unique across this demo set, so it's used as the upsert match instead.
  for (const route of transportRoutes) {
    await TransportRoute.findOneAndUpdate({ origin: route.origin, destination: route.destination }, route, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${transportRoutes.length} transport routes into MongoDB.`);

  // Reviews are intentionally not seeded here — there is no fabricated/demo dataset for
  // them. Real reviews go directly into the Review collection (see models/Review.ts) and
  // must be marked verified+approved before lib/reviews.ts's public query will surface them.

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
