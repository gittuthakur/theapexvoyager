import mongoose from 'mongoose';
import { tours } from '../config/tours.config';
import { hotels } from '../config/hotels.config';
import { connectDB } from '../lib/mongodb';
import { Tour } from '../models/Tour';
import { Hotel } from '../models/Hotel';

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

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
