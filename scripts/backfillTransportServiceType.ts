/**
 * One-time, idempotent safety net: sets `serviceType` on any TransportVehicle document
 * still missing it, inferred from `category`. The known 5 pre-existing vehicles already
 * get `serviceType` for free from config/transport.config.ts on the next `npm run
 * db:seed` (which re-upserts them by slug) — this script exists only to catch anything
 * outside that static config that predates the `serviceType` field. Never guesses for
 * an unrecognized category — logs it instead, matching scripts/backfillRegionRefs.ts's
 * existing convention.
 */
import mongoose from 'mongoose';
import { connectDB } from '../lib/mongodb';
import { TransportVehicle } from '../models/TransportVehicle';

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  await connectDB();

  const cabWithDriver = await TransportVehicle.updateMany(
    { serviceType: { $exists: false }, category: { $in: ['Comfort', 'SUV', 'Premium'] } },
    { $set: { serviceType: 'Cab with Driver' } }
  );
  console.log(`Set serviceType='Cab with Driver' on ${cabWithDriver.modifiedCount} vehicles.`);

  const groupTransport = await TransportVehicle.updateMany(
    { serviceType: { $exists: false }, category: { $in: ['Tempo Traveller', 'Coach', 'Mini Bus'] } },
    { $set: { serviceType: 'Group Transport' } }
  );
  console.log(`Set serviceType='Group Transport' on ${groupTransport.modifiedCount} vehicles.`);

  const stillUnset = await TransportVehicle.find({ serviceType: { $exists: false } }).lean();
  if (stillUnset.length > 0) {
    console.log(`Unmatched (needs manual serviceType): ${stillUnset.map((v) => v.slug).join(', ')}`);
  } else {
    console.log('All TransportVehicle documents now have a serviceType.');
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Transport serviceType backfill failed:', error);
  process.exit(1);
});
