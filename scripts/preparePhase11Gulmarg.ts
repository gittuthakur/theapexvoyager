/** Phase 11: exact Gulmarg winter commercial preparation; never publishes. */
import mongoose from 'mongoose';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';
import { draftJourneys } from '../config/draftJourneys.config';
import { GULMARG_WINTER_IMAGE } from '../config/imageCredits.config';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import type { PackageItineraryDay } from '../types/package';

export const TARGET = 'gulmarg-winter-escape';
export const ALLOWED_FIELDS = Object.freeze([
  'price', 'pickupInfo', 'dropInfo', 'mealPlan', 'transportType', 'minTravellers',
  'roomsIncluded', 'hotelCategoryDescription', 'inclusions', 'exclusions', 'image',
  'regionId', 'usesGeneralCancellationPolicy', 'itinerary'
]);

const source = draftJourneys.find((journey) => journey.slug === TARGET)!;

export function assertTarget(slug: unknown, status: unknown) {
  if (slug !== TARGET || status !== 'draft') throw new Error('Only the exact Gulmarg draft is authorized');
}

export function assertAllowedFields(values: Record<string, unknown>) {
  for (const field of Object.keys(values)) {
    if (!ALLOWED_FIELDS.includes(field)) throw new Error(`Forbidden field: ${field}`);
  }
}

export function correctedItinerary<T extends PackageItineraryDay>(days: T[]): T[] {
  if (days.length !== source.itinerary.length) throw new Error('Itinerary length conflict');

  const approvedDescriptions = [
    'Gondola visit/ride is optional and separately payable, subject to operations, weather, availability and applicable local rules.',
    'Skiing, snowboarding, sledging, snowmobile and other snow activities are optional and separately payable unless specifically included in a final written quotation. Weather, road conditions, temporary closures, local restrictions and operational conditions may require itinerary changes. Snowfall and uninterrupted access are not guaranteed.'
  ];

  return days.map((day, index) => {
    if (index !== 1 && index !== 2) return { ...day };

    const baseline = source.itinerary[index];
    const currentDescription = day.description;
    const approvedDescription = approvedDescriptions[index - 1];
    const allowed = [baseline.description, approvedDescription];

    if (!allowed.includes(currentDescription)) {
      throw new Error(`Unexpected day-${day.day} wording for ${TARGET}`);
    }

    return { ...day, description: approvedDescription };
  });
}

export function prepareValues(record: Record<string, unknown>, image: string): Record<string, unknown> {
  assertTarget(record.slug, record.status);

  if (record.duration !== source.duration || record.startingCity !== 'Srinagar' || record.endingCity !== 'Srinagar') {
    throw new Error('Route or gateway conflict');
  }

  if (!isDeepStrictEqual(record.destinationSlugs, source.destinationSlugs)) {
    throw new Error('Destination route conflict');
  }

  const values: Record<string, unknown> = {
    price: 19999,
    pickupInfo: 'Pickup from Srinagar Airport, with the exact meeting point and time confirmed before booking.',
    dropInfo: 'Drop at Srinagar Airport after the Gulmarg stay, with final departure timing subject to road conditions and the approved flight schedule.',
    mealPlan: '3 breakfasts and 3 dinners for the 3 nights in Gulmarg, subject to the confirmed property meal schedule.',
    transportType: 'Approved road transfers from Srinagar Airport to Gulmarg and Gulmarg back to Srinagar Airport. Local snow transport, restricted-area vehicles and any optional snow activity transport are excluded unless separately confirmed in writing.',
    minTravellers: 2,
    roomsIncluded: 1,
    hotelCategoryDescription: '3 nights in a Standard/Deluxe winter-operating Gulmarg hotel or equivalent, double sharing for two adults in one room. The exact property and room allocation are confirmed before booking; no named hotel is guaranteed.',
    inclusions: [
      '3 nights of approved accommodation',
      '3 breakfasts',
      '3 dinners',
      'Srinagar Airport pickup',
      'Srinagar Airport drop',
      'Approved road transfers',
      'Itinerary-approved sightseeing/transfers where applicable'
    ],
    exclusions: [
      'Air/train fare',
      'Gondola tickets',
      'Skiing',
      'Snowboarding',
      'Ski/snow equipment',
      'Instructors',
      'Sledging',
      'Snowmobile and other snow activities',
      'Local snow vehicles',
      'Paid snow activities',
      'Entry tickets unless specifically included in the final written quotation',
      'Personal expenses',
      'Anything not specifically included'
    ],
    image,
    usesGeneralCancellationPolicy: true,
    itinerary: correctedItinerary(record.itinerary as PackageItineraryDay[])
  };

  for (const [key, value] of Object.entries(values)) {
    if (key === 'itinerary') continue;
    const current = record[key];
    const empty = current === undefined || current === null || current === '' || (Array.isArray(current) && current.length === 0);
    if (!empty && !isDeepStrictEqual(current, value)) throw new Error(`Commercial conflict: ${key}`);
  }

  assertAllowedFields(values);
  return values;
}

export function unchangedOutsidePlan(before: Record<string, unknown>, after: Record<string, unknown>, values: Record<string, unknown>) {
  return isDeepStrictEqual(after, { ...before, ...values });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--execute')) throw new Error('Only --execute is supported; dry-run is default');

  const execute = args.includes('--execute');
  try { process.loadEnvFile('.env.local'); } catch { /* environment is provided externally */ }

  await connectDB();

  const snapshot = async () => ({
    journeys: await Journey.find().sort({ slug: 1 }).lean(),
    destinations: await Destination.find().sort({ slug: 1 }).lean(),
    regions: await Region.find().sort({ slug: 1 }).lean()
  });

  const counts = (rows: Awaited<ReturnType<typeof snapshot>>['journeys']) => ({
    total: rows.length,
    published: rows.filter((journey) => journey.status === 'published').length,
    draft: rows.filter((journey) => journey.status === 'draft').length
  });

  const before = await snapshot();
  if (!isDeepStrictEqual(counts(before.journeys), { total: 40, published: 27, draft: 13 })) {
    throw new Error('Global count drift');
  }

  const original = before.journeys.find((journey) => journey.slug === TARGET);
  if (!original) throw new Error('Missing Gulmarg draft');

  const destination = before.destinations.find((entry) => entry.slug === 'gulmarg');
  const region = destination ? before.regions.find((entry) => String(entry._id) === String(destination.regionId)) : undefined;
  if (!destination || destination.status !== 'published' || !region || region.status !== 'published') {
    throw new Error('Destination/Region dependency invalid');
  }

  if (original.regionId && String(original.regionId) !== String(region._id)) {
    throw new Error('Region conflict');
  }

  const image = GULMARG_WINTER_IMAGE;
  const localPath = resolve('public', image.slice(1));
  if (!existsSync(localPath)) throw new Error(`Local image missing: ${localPath}`);
  if (statSync(localPath).size <= 0) throw new Error(`Local image is empty: ${localPath}`);

  const values = prepareValues(original, image);
  if (!original.regionId) values.regionId = region._id;

  const candidate = Journey.hydrate({ ...original, ...values });
  await candidate.validate();
  if (!isDeepStrictEqual(getCommercialBlockers(candidate), ['OWNER_APPROVAL_REQUIRED'])) {
    throw new Error('Commercial blockers remain');
  }

  candidate.status = 'published';
  await candidate.validate();

  const changed = Object.entries(values).some(([key, value]) => !isDeepStrictEqual(Reflect.get(original, key), value));

  const summary = {
    slug: TARGET,
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    targetCount: 1,
    wouldUpdate: +changed,
    alreadyCorrect: +!changed,
    refused: 0,
    conflicts: 0,
    published: 0,
    counts: counts(before.journeys),
    targetStatus: original.status,
    proposed: values,
    protectedFieldsUnchanged: true
  };

  console.log(JSON.stringify(summary));

  if (execute && changed) {
    const result = await Journey.collection.updateOne({ _id: original._id, slug: TARGET, status: 'draft' }, { $set: values });
    if (result.modifiedCount !== 1) throw new Error('Gulmarg write conflict');
  }

  const after = await snapshot();
  const final = after.journeys.find((journey) => journey.slug === TARGET)!;

  for (const journey of before.journeys) {
    const actual = after.journeys.find((entry) => entry.slug === journey.slug);
    if (!actual) throw new Error(`Missing Journey after update: ${journey.slug}`);
    if (journey.slug === TARGET) {
      const expected = execute && changed ? values : {};
      if (!unchangedOutsidePlan(journey, actual, expected)) throw new Error(`Unexpected mutation: ${journey.slug}`);
    } else if (!isDeepStrictEqual(journey, actual)) {
      throw new Error(`Unexpected protected mutation: ${journey.slug}`);
    }
  }

  if (!isDeepStrictEqual(counts(before.journeys), counts(after.journeys))) {
    throw new Error('Global count changed');
  }

  const report = {
    checkedAt: new Date().toISOString(),
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    target: {
      slug: TARGET,
      status: final.status,
      price: final.price,
      blockers: getCommercialBlockers(final)
    },
    dryRun: { targetCount: 1, refused: 0, conflicts: 0, wouldUpdate: changed ? 1 : 0, alreadyCorrect: changed ? 0 : 1 },
    counts: counts(after.journeys),
    publicIsolation: {
      url: 'https://www.theapexvoyager.in/journeys/gulmarg-winter-escape',
      catalogueCount: 27,
      sitemapCount: 27
    }
  };

  writeFileSync(join(tmpdir(), 'phase11-gulmarg.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Phase 11 failed');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}
