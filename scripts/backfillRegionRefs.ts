/**
 * One-time, idempotent backfill of `regionId`/`regionIds` on the Mongo collections that
 * predate the Region Hub feature (Tour, Hotel, Journey, Expert, TransportRoute,
 * TransportVehicle) — see the project plan's "Adding regionId to existing models"
 * section. Safe to re-run: every write is a pure re-derivation from each document's
 * existing business fields (destinationSlug(s), location, origin/destination,
 * serviceAreas), never a `$push`/`$addToSet`, and never touches any other field.
 *
 * Run after `npm run db:seed` (Region + Destination must already exist).
 */
import mongoose from 'mongoose';
import { connectDB } from '../lib/mongodb';
import { Region, type RegionDocument } from '../models/Region';
import { Destination, type DestinationDocument } from '../models/Destination';
import { Tour, type TourDocument } from '../models/Tour';
import { Hotel, type HotelDocument } from '../models/Hotel';
import { Journey, type JourneyDocument } from '../models/Journey';
import { Expert, type ExpertDocument } from '../models/Expert';
import { TransportRoute, type TransportRouteDocument } from '../models/TransportRoute';
import { TransportVehicle, type TransportVehicleDocument } from '../models/TransportVehicle';
import { TransportPartner, type TransportPartnerDocument } from '../models/TransportPartner';

interface Summary {
  scanned: number;
  matched: number;
  unmatched: string[];
}

function newSummary(): Summary {
  return { scanned: 0, matched: 0, unmatched: [] };
}

function printSummary(model: string, summary: Summary) {
  console.log(`\n${model}: scanned ${summary.scanned}, matched ${summary.matched}, unmatched ${summary.unmatched.length}`);
  if (summary.unmatched.length > 0) {
    console.log(`  Unmatched: ${summary.unmatched.join(', ')}`);
  }
}

/** Case-insensitive substring match of `text` against every destination title — returns a regionId only when exactly one destination matches, never a guess. */
function matchOneDestinationByText(
  text: string,
  destinationsByTitle: Array<{ title: string; regionId?: mongoose.Types.ObjectId }>
): mongoose.Types.ObjectId | undefined {
  const needle = text.trim().toLowerCase();
  if (!needle) return undefined;
  const matches = destinationsByTitle.filter(
    (destination) => destination.regionId && (needle.includes(destination.title.toLowerCase()) || destination.title.toLowerCase().includes(needle))
  );
  const uniqueRegionIds = Array.from(new Set(matches.map((m) => String(m.regionId))));
  return uniqueRegionIds.length === 1 ? matches[0].regionId : undefined;
}

async function main() {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  await connectDB();

  const destinationDocs = await Destination.find().lean<DestinationDocument[]>();
  const destinationBySlug = new Map(destinationDocs.map((doc) => [doc.slug, doc]));
  const destinationsByTitle = destinationDocs.map((doc) => ({ title: doc.title, regionId: doc.regionId }));

  const regionDocs = await Region.find().lean<RegionDocument[]>();
  const regionIdByName = new Map(regionDocs.map((doc) => [doc.name.toLowerCase(), doc._id]));

  // Journey — resolve directly via destinationSlugs, no fuzzy matching.
  const journeySummary = newSummary();
  const journeys = await Journey.find().lean<JourneyDocument[]>();
  for (const journey of journeys) {
    journeySummary.scanned++;
    const firstResolvable = journey.destinationSlugs?.find((slug) => destinationBySlug.get(slug)?.regionId);
    const regionId = firstResolvable ? destinationBySlug.get(firstResolvable)?.regionId : undefined;
    if (regionId) {
      journeySummary.matched++;
      await Journey.updateOne({ _id: journey._id }, { $set: { regionId } });
    } else {
      journeySummary.unmatched.push(journey.slug);
    }
  }
  printSummary('Journey', journeySummary);

  // Tour — same direct resolution via destinationSlug.
  const tourSummary = newSummary();
  const tours = await Tour.find().lean<TourDocument[]>();
  for (const tour of tours) {
    tourSummary.scanned++;
    const regionId = tour.destinationSlug ? destinationBySlug.get(tour.destinationSlug)?.regionId : undefined;
    if (regionId) {
      tourSummary.matched++;
      await Tour.updateOne({ _id: tour._id }, { $set: { regionId } });
    } else {
      tourSummary.unmatched.push(tour.slug);
    }
  }
  printSummary('Tour', tourSummary);

  // Expert — destinationSlugs resolve to a deduplicated set of regionIds.
  const expertSummary = newSummary();
  const experts = await Expert.find().lean<ExpertDocument[]>();
  for (const expert of experts) {
    expertSummary.scanned++;
    const regionIds = Array.from(
      new Set(
        expert.destinationSlugs
          .map((slug) => destinationBySlug.get(slug)?.regionId)
          .filter((id): id is mongoose.Types.ObjectId => Boolean(id))
          .map(String)
      )
    ).map((id) => new mongoose.Types.ObjectId(id));
    if (regionIds.length > 0) {
      expertSummary.matched++;
      await Expert.updateOne({ _id: expert._id }, { $set: { regionIds } });
    } else {
      expertSummary.unmatched.push(expert.slug);
    }
  }
  printSummary('Expert', expertSummary);

  // Hotel — free-text `location`, case-insensitive substring match against Destination titles.
  const hotelSummary = newSummary();
  const hotelsList = await Hotel.find().lean<HotelDocument[]>();
  for (const hotel of hotelsList) {
    hotelSummary.scanned++;
    const regionId = matchOneDestinationByText(hotel.location, destinationsByTitle);
    if (regionId) {
      hotelSummary.matched++;
      await Hotel.updateOne({ _id: hotel._id }, { $set: { regionId } });
    } else {
      hotelSummary.unmatched.push(`${hotel.slug} ("${hotel.location}")`);
    }
  }
  printSummary('Hotel', hotelSummary);

  // TransportRoute — free-text `origin` + `destination`, tried in that order.
  const routeSummary = newSummary();
  const routes = await TransportRoute.find().lean<TransportRouteDocument[]>();
  for (const route of routes) {
    routeSummary.scanned++;
    const regionId =
      matchOneDestinationByText(route.origin, destinationsByTitle) ?? matchOneDestinationByText(route.destination, destinationsByTitle);
    if (regionId) {
      routeSummary.matched++;
      await TransportRoute.updateOne({ _id: route._id }, { $set: { regionId } });
    } else {
      routeSummary.unmatched.push(`${route.origin} → ${route.destination}`);
    }
  }
  printSummary('TransportRoute', routeSummary);

  // TransportVehicle — `serviceAreas` lists region names directly (e.g. "Himachal
  // Pradesh", "Jammu & Kashmir"), not destination names — every seeded vehicle
  // genuinely covers all three regions (config/transport.config.ts's SERVICE_AREAS),
  // so this matches Region.name directly and collects every match, unlike the
  // single-destination-title matching used for Hotel/TransportRoute below.
  const vehicleSummary = newSummary();
  const vehicles = await TransportVehicle.find().lean<TransportVehicleDocument[]>();
  for (const vehicle of vehicles) {
    vehicleSummary.scanned++;
    const regionIds = Array.from(
      new Set(
        vehicle.serviceAreas
          .map((area) => regionIdByName.get(area.trim().toLowerCase()))
          .filter((id): id is mongoose.Types.ObjectId => Boolean(id))
          .map(String)
      )
    ).map((id) => new mongoose.Types.ObjectId(id));
    if (regionIds.length > 0) {
      vehicleSummary.matched++;
      await TransportVehicle.updateOne({ _id: vehicle._id }, { $set: { regionIds } });
    } else {
      vehicleSummary.unmatched.push(vehicle.slug);
    }
  }
  printSummary('TransportVehicle', vehicleSummary);

  // TransportPartner — same `serviceAreas` → Region.name derivation as TransportVehicle
  // above. A safe no-op today: zero partners exist until one onboards via
  // /transport/partner.
  const partnerSummary = newSummary();
  const partners = await TransportPartner.find().lean<TransportPartnerDocument[]>();
  for (const partner of partners) {
    partnerSummary.scanned++;
    const regionIds = Array.from(
      new Set(
        partner.serviceAreas
          .map((area) => regionIdByName.get(area.trim().toLowerCase()))
          .filter((id): id is mongoose.Types.ObjectId => Boolean(id))
          .map(String)
      )
    ).map((id) => new mongoose.Types.ObjectId(id));
    if (regionIds.length > 0) {
      partnerSummary.matched++;
      await TransportPartner.updateOne({ _id: partner._id }, { $set: { regionIds } });
    } else {
      partnerSummary.unmatched.push(partner.businessName);
    }
  }
  printSummary('TransportPartner', partnerSummary);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Region ref backfill failed:', error);
  process.exit(1);
});
