import mongoose from 'mongoose';
import { tours } from '../config/tours.config';
import { hotels } from '../config/hotels.config';
import { packages } from '../config/packages.config';
import { travelExperts } from '../config/experts.config';
import { DEMO_REVIEWS } from '../config/reviews.config';
import { vehicleOptions } from '../config/transport.config';
import { transportRoutes } from '../config/transportRoutes.config';
import { connectDB } from '../lib/mongodb';
import { Tour } from '../models/Tour';
import { Hotel } from '../models/Hotel';
import { Journey } from '../models/Journey';
import { Expert } from '../models/Expert';
import { Review } from '../models/Review';
import { TransportVehicle } from '../models/TransportVehicle';
import { TransportRoute } from '../models/TransportRoute';

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  await connectDB();

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

  // Routes have no natural business key like `slug` — {origin, destination} is stable and
  // unique across this demo set, so it's used as the upsert match instead.
  for (const route of transportRoutes) {
    await TransportRoute.findOneAndUpdate({ origin: route.origin, destination: route.destination }, route, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${transportRoutes.length} transport routes into MongoDB.`);

  // Reviews have no natural business key like `slug` — {author, quote} is stable and
  // unique across this demo set, so it's used as the upsert match instead.
  for (const { id, ...review } of DEMO_REVIEWS) {
    await Review.findOneAndUpdate({ author: review.author, quote: review.quote }, review, { upsert: true, returnDocument: 'after' });
  }
  console.log(`Seeded ${DEMO_REVIEWS.length} reviews into MongoDB.`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
