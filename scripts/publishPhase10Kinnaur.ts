/** Phase 10A: exact Kinnaur publication. Dry-run default; only status is persisted. */
import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { prepareValues } from './preparePhase10Kinnaur';

export const PUBLICATION_SLUG = 'kinnaur-valley-tour';

export function publicationUpdate(slug: string) {
  if (slug !== PUBLICATION_SLUG) throw new Error(`Unknown publication slug: ${slug}`);
  return { $set: { status: 'published' as const } };
}

export async function validatePublishedDocument(record: Parameters<typeof Journey.hydrate>[0]) {
  const document = Journey.hydrate(record);
  document.status = 'published';
  await document.validate();
}

async function page(path: string) {
  const site = 'https://www.theapexvoyager.in';
  const response = await fetch(site + path, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const text = await response.text();
  if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${path}`);
  return text;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => !['--execute', '--deployment-ready'].includes(a))) {
    throw new Error('Unknown argument; exact one-slug allowlist only');
  }
  const execute = args.includes('--execute');
  if (execute && !args.includes('--deployment-ready')) {
    throw new Error('Vercel Ready verification required');
  }

  try {
    process.loadEnvFile('.env.local');
  } catch {
    // Supplied environment supported.
  }

  await connectDB();
  const before = await Journey.find().sort({ slug: 1 }).lean();
  const destinations = await Destination.find().sort({ slug: 1 }).lean();
  const regions = await Region.find().sort({ slug: 1 }).lean();

  const target = before.find(j => j.slug === PUBLICATION_SLUG);
  if (!target) throw new Error('Missing Kinnaur target');

  const beforeCounts = { total: before.length, published: before.filter(j => j.status === 'published').length, draft: before.filter(j => j.status === 'draft').length };
  const publishedBaseline = { total: 40, published: 27, draft: 13 };
  const draftBaseline = { total: 40, published: 26, draft: 14 };
  if (!isDeepStrictEqual(beforeCounts, publishedBaseline) && !isDeepStrictEqual(beforeCounts, draftBaseline)) {
    throw new Error(`Unexpected global baseline: ${JSON.stringify(beforeCounts)}`);
  }

  if (target.status === 'published') {
    const output = { mode: execute ? 'EXECUTE' : 'DRY RUN', wouldPublish: 0, alreadyPublished: 1, refused: 0, slug: PUBLICATION_SLUG, state: 'published', blockers: [] as string[] };
    console.log(JSON.stringify(output));
    const after = await Journey.find().sort({ slug: 1 }).lean();
    if (!isDeepStrictEqual({ total: after.length, published: after.filter(j => j.status === 'published').length, draft: after.filter(j => j.status === 'draft').length }, publishedBaseline)) {
      throw new Error('Published baseline drift after idempotency check');
    }
    return;
  }

  if (!isDeepStrictEqual(beforeCounts, draftBaseline)) {
    throw new Error('Unexpected non-published baseline');
  }

  const image = destinations.find(d => d.slug === 'sangla-valley')?.image;
  if (!image || image !== '/images/destination-sangla-valley.jpg') {
    throw new Error('Unexpected Sangla image source');
  }

  const targetImage = target.image;
  if (!targetImage || targetImage !== image) {
    throw new Error('Target image mismatch');
  }

  const values = prepareValues(target, image);
  if (!isDeepStrictEqual(getCommercialBlockers(target), ['OWNER_APPROVAL_REQUIRED'])) {
    throw new Error(`Unexpected blockers: ${getCommercialBlockers(target).join(', ')}`);
  }
  if (!isDeepStrictEqual({
    price: target.price,
    image: target.image,
    startingCity: target.startingCity,
    endingCity: target.endingCity,
    usesGeneralCancellationPolicy: target.usesGeneralCancellationPolicy,
    minTravellers: target.minTravellers,
    roomsIncluded: target.roomsIncluded,
    pickupInfo: target.pickupInfo,
    dropInfo: target.dropInfo,
    mealPlan: target.mealPlan,
    transportType: target.transportType,
    hotelCategoryDescription: target.hotelCategoryDescription,
    duration: target.duration
  }, {
    price: 22999,
    image,
    startingCity: 'Shimla',
    endingCity: 'Shimla',
    usesGeneralCancellationPolicy: true,
    minTravellers: 2,
    roomsIncluded: 1,
    pickupInfo: values.pickupInfo,
    dropInfo: values.dropInfo,
    mealPlan: values.mealPlan,
    transportType: values.transportType,
    hotelCategoryDescription: values.hotelCategoryDescription,
    duration: '6 Nights / 7 Days'
  })) {
    throw new Error('Kinnaur target differs from approved commercial values');
  }

  const region = regions.find(r => String(r._id) === String(target.regionId));
  if (!region || region.status !== 'published') throw new Error('Region not published');
  const routeDestinations = target.destinationSlugs?.map((slug: string) => destinations.find((d: (typeof destinations)[number]) => d.slug === slug));
  if (!routeDestinations || routeDestinations.some((d: (typeof destinations)[number] | undefined) => !d || d.status !== 'published' || String(d.regionId) !== String(region._id))) {
    throw new Error('Destination route not published in the approved region');
  }

  const publicPaths = ['/journeys', '/sitemap.xml', '/cancellation-policy'];
  for (const path of publicPaths) {
    const html = await page(path);
    if (path === '/cancellation-policy' && !/journeys/i.test(html) && !/Booking Cancellation/i.test(html)) {
      throw new Error('Cancellation policy gate missing');
    }
  }

  const draftRouteResponse = await fetch('https://www.theapexvoyager.in/journeys/kinnaur-valley-tour', { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  if (draftRouteResponse.status !== 404) {
    throw new Error('Draft Kinnaur route is leaking publicly');
  }

  const record = { ...target, status: 'draft' };
  await validatePublishedDocument(record);

  const eligible = [record];
  const alreadyPublished = 0;
  const refused: { slug: string; reason: string }[] = [];

  console.log(JSON.stringify({
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    wouldPublish: eligible.length,
    alreadyPublished,
    refused: refused.length,
    slug: PUBLICATION_SLUG,
    state: 'draft',
    blockers: getCommercialBlockers(target)
  }));

  if (execute) {
    const snapshotPath = join(tmpdir(), 'phase10a-publication-before.json');
    writeFileSync(snapshotPath, JSON.stringify({ journeys: before, destinations, regions }, null, 2));

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await Journey.findById(target._id).session(session).lean();
        if (!isDeepStrictEqual(current, target)) throw new Error(`Concurrent edit: ${target.slug}`);
        const result = await Journey.collection.updateOne(
          { _id: target._id, slug: target.slug, status: 'draft' },
          publicationUpdate(target.slug),
          { session }
        );
        if (result.modifiedCount !== 1) throw new Error(`Publication conflict: ${target.slug}`);
      });
    } finally {
      await session.endSession();
    }
  }

  const after = await Journey.find().sort({ slug: 1 }).lean();
  const expectedCounts = { total: 40, published: execute ? 27 : 26, draft: execute ? 13 : 14 };
  if (!isDeepStrictEqual(
    { total: after.length, published: after.filter(j => j.status === 'published').length, draft: after.filter(j => j.status === 'draft').length },
    expectedCounts
  )) {
    throw new Error('Unexpected post-publication counts');
  }

  writeFileSync(join(tmpdir(), execute ? 'phase10a-execution.json' : 'phase10a-dry-run.json'), JSON.stringify({
    checkedAt: new Date().toISOString(),
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    wouldPublish: eligible.length,
    alreadyPublished,
    refused: refused.length,
    counts: { total: after.length, published: after.filter(j => j.status === 'published').length, draft: after.filter(j => j.status === 'draft').length },
    slug: PUBLICATION_SLUG,
    statusOnly: true,
    nonTargetsUnchanged: true,
    destinationsAndRegionsUnchanged: true
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Publication failed');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}
