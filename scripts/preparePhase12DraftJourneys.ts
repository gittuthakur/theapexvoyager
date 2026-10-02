/** Phase 12 bulk commercial preparation. Dry-run default; never changes publication status. */
import mongoose from 'mongoose';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { assertPhase12DraftInventory, evaluatePreparationPlan, findDraftPublicLeaks, preparationOnlyChangesAllowed, type Phase12PreparationPlan } from './phase12DraftPreparationGuard';
import type { PackageItineraryDay } from '../types/package';

export const PHASE12_PLAN_SLUGS = Object.freeze(['kashmir-winter-snow-tour']);

const KASHMIR_BASELINE = [
  'Arrive in Srinagar; evening at leisure, houseboat stay where available.',
  'Travel to Gulmarg for its winter Gondola and snow scenery, conditions permitting.',
  'A further day in Gulmarg; skiing/snow activities are subject to season, snowfall and operator availability, not guaranteed.'
];

export function buildKashmirWinterPlan(record: Record<string, unknown>): Phase12PreparationPlan {
  if (record.slug !== 'kashmir-winter-snow-tour' || record.status !== 'draft') throw new Error('Kashmir plan accepts only its exact production draft');
  if (record.duration !== '4 Nights / 5 Days' || record.startingCity !== 'Srinagar' || record.endingCity !== 'Srinagar') {
    throw new Error('Kashmir route/gateway differs from the audited production record');
  }
  if (!isDeepStrictEqual(record.destinationSlugs, ['srinagar', 'gulmarg', 'pahalgam'])) throw new Error('Kashmir destination route changed');

  const currentItinerary = record.itinerary as PackageItineraryDay[];
  if (!Array.isArray(currentItinerary) || currentItinerary.length !== 5) throw new Error('Kashmir itinerary length changed');
  for (const [index, baseline] of KASHMIR_BASELINE.entries()) {
    if (currentItinerary[index]?.day !== index + 1 || currentItinerary[index]?.description !== baseline) {
      throw new Error(`Unexpected Kashmir day-${index + 1} copy; manual review required`);
    }
  }

  const itinerary = currentItinerary.map((day) => {
    if (day.day === 1) {
      return {
        ...day,
        description: 'Arrive in Srinagar and stay at a winter-operating hotel as part of the hotel-only base package. Houseboat accommodation is not included; it may be requested as an optional upgrade only after separate pricing and availability confirmation.'
      };
    }
    if (day.day === 2) {
      return {
        ...day,
        description: 'Travel to Gulmarg for winter scenery. The Gondola is optional and separately payable, subject to operations, weather, availability and applicable local rules.'
      };
    }
    if (day.day === 3) {
      return {
        ...day,
        description: 'Skiing, snowboarding, ski equipment, instructors, sledging, snowmobile and other snow activities are optional and separately payable unless specifically included in a final written quotation. Weather, road conditions, temporary closures, local restrictions and operational conditions may require itinerary changes. Snowfall and Gondola operation are not guaranteed.'
      };
    }
    return { ...day };
  });

  const values = {
    price: 21999,
    minTravellers: 2,
    roomsIncluded: 1,
    hotelCategoryDescription: 'Hotel-only base: 4 nights in Standard/Deluxe winter-operating hotels or equivalent, double sharing for two adults in one room; Srinagar 1 night, Gulmarg 2 nights, Pahalgam 1 night. No houseboat is included. A houseboat may be requested as an optional upgrade only after separate pricing and availability confirmation.',
    inclusions: ['4 nights of approved hotel accommodation on a double-sharing basis'],
    exclusions: [
      'Air/train fare',
      'Gondola tickets',
      'Skiing',
      'Snowboarding',
      'Ski/snow equipment',
      'Instructors',
      'Sledging',
      'Snowmobile and other snow activities',
      'Local-union/local snow vehicles',
      'Entry tickets unless specifically included in a final written quotation',
      'Personal expenses',
      'Anything not specifically included'
    ],
    usesGeneralCancellationPolicy: true,
    itinerary
  };
  const allowedFields = Object.freeze(Object.keys(values));
  return {
    slug: 'kashmir-winter-snow-tour',
    allowedFields,
    values,
    expectedCurrentValues: { itinerary: currentItinerary },
    evidence: { ownerApproved: true, supplierConfirmed: false, imageVerified: false }
  };
}

const site = 'https://www.theapexvoyager.in';

async function verifyPublicBaseline(drafts: Array<{ slug: string }>) {
  const [catalogueResponse, sitemapResponse] = await Promise.all([
    fetch(`${site}/api/journeys`, { redirect: 'manual', signal: AbortSignal.timeout(45000) }),
    fetch(`${site}/sitemap.xml`, { redirect: 'manual', signal: AbortSignal.timeout(45000) })
  ]);
  const [catalogueData, sitemap] = await Promise.all([catalogueResponse.json(), sitemapResponse.text()]);
  const catalogueSlugs = (catalogueData.journeys ?? []).map((journey: { slug: string }) => journey.slug);
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).filter((url) => url.includes('/journeys/'));
  if (catalogueResponse.status !== 200 || catalogueSlugs.length !== 28 || sitemapResponse.status !== 200 || sitemapUrls.length !== 28) {
    throw new Error('Unexpected public catalogue/sitemap baseline');
  }
  const leaks = findDraftPublicLeaks(drafts.map((draft) => draft.slug), catalogueSlugs, sitemapUrls);
  if (!leaks.isolated) throw new Error(`Draft leak detected: ${JSON.stringify(leaks)}`);
  const routeStatuses: Record<string, number> = {};
  for (const draft of drafts) {
    const response = await fetch(`${site}/journeys/${draft.slug}`, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
    routeStatuses[draft.slug] = response.status;
    if (response.status !== 404) throw new Error(`Draft route is not 404: ${draft.slug}`);
  }
  return { catalogueCount: catalogueSlugs.length, sitemapCount: sitemapUrls.length, leaks, routeStatuses };
}

async function verifyImage(image: unknown) {
  if (typeof image !== 'string' || !image.startsWith('/images/')) return { verified: false, reason: 'IMAGE_FIELD_MISSING' };
  const localPath = resolve('public', image.slice(1));
  if (!existsSync(localPath)) return { verified: false, reason: 'LOCAL_IMAGE_MISSING' };
  const response = await fetch(site + image, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  if (response.status !== 200 || !response.headers.get('content-type')?.startsWith('image/') || !(await response.arrayBuffer()).byteLength) {
    return { verified: false, reason: 'PRODUCTION_IMAGE_INVALID', status: response.status };
  }
  return { verified: true, status: response.status };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--execute', '--owner-approved'].includes(arg))) throw new Error('Only --execute and --owner-approved are supported');
  const execute = args.includes('--execute');
  if (execute && !args.includes('--owner-approved')) throw new Error('Execution requires explicit owner approval');
  try { process.loadEnvFile('.env.local'); } catch { /* Supplied environment supported. */ }
  await connectDB();

  const before = await Journey.find().sort({ slug: 1 }).lean();
  const drafts = before.filter((record) => record.status === 'draft');
  const draftSlugs = assertPhase12DraftInventory(drafts);
  const counts = { total: before.length, published: before.filter((record) => record.status === 'published').length, draft: drafts.length };
  if (!isDeepStrictEqual(counts, { total: 40, published: 28, draft: 12 })) throw new Error('Production counts drifted from the Phase 12 baseline');
  const publicBaseline = await verifyPublicBaseline(drafts);

  const plans: Phase12PreparationPlan[] = [];
  const kashmir = drafts.find((record) => record.slug === 'kashmir-winter-snow-tour');
  if (!kashmir || !PHASE12_PLAN_SLUGS.includes(kashmir.slug)) throw new Error('Explicit Kashmir plan target missing');
  const plan = buildKashmirWinterPlan(kashmir);
  plans.push(plan);

  const decisions = [];
  for (const current of drafts) {
    const currentPlan = plans.find((entry) => entry.slug === current.slug);
    if (!currentPlan) continue;
    const image = await verifyImage(currentPlan.values.image);
    const candidate = { ...current, ...currentPlan.values };
    const blockers = getCommercialBlockers(candidate);
    const decision = evaluatePreparationPlan(current, currentPlan, blockers);
    if (!image.verified) decision.blockers.push(image.reason ?? 'IMAGE_VERIFICATION_FAILED');
    const document = Journey.hydrate(candidate);
    try {
      await document.validate();
    } catch (error) {
      decision.blockers.push(`DOCUMENT_VALIDATION:${error instanceof Error ? error.message : 'failed'}`);
    }
    if (decision.blockers.length && decision.action !== 'REFUSED') decision.action = 'REFUSED';
    decisions.push({ ...decision, readinessBlockers: blockers, image, proposedFields: currentPlan.allowedFields });
  }

  const eligible = decisions.filter((decision) => decision.action === 'UPDATE');
  const refused = decisions.filter((decision) => decision.action === 'REFUSED');
  console.log(JSON.stringify({
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    inventoryCount: draftSlugs.length,
    targetCount: plans.length,
    wouldUpdate: eligible.length,
    alreadyCorrect: decisions.filter((decision) => decision.action === 'ALREADY_CORRECT').length,
    refused: refused.length,
    decisions,
    protectedStatus: true,
    protectedSlug: true,
    protectedDuration: true,
    counts,
    publicBaseline
  }, null, 2));

  if (execute && eligible.length) {
    for (const decision of eligible) {
      const current = drafts.find((row) => row.slug === decision.slug)!;
      const currentPlan = plans.find((entry) => entry.slug === decision.slug)!;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const latest = await Journey.findById(current._id).session(session).lean();
          if (!isDeepStrictEqual(latest, current)) throw new Error(`Concurrent edit: ${current.slug}`);
          const result = await Journey.collection.updateOne(
            { _id: current._id, slug: currentPlan.slug, status: 'draft' },
            { $set: currentPlan.values },
            { session }
          );
          if (result.modifiedCount !== 1) throw new Error(`Preparation conflict: ${current.slug}`);
        });
      } finally {
        await session.endSession();
      }
    }
  }

  const after = await Journey.find().sort({ slug: 1 }).lean();
  for (const original of before) {
    const updated = decisions.find((decision) => decision.slug === original.slug && decision.action === 'UPDATE');
    const updatedPlan = updated ? plans.find((entry) => entry.slug === original.slug)! : null;
    const expected = execute && updatedPlan ? { ...original, ...updatedPlan.values } : original;
    if (!isDeepStrictEqual(after.find((record) => record.slug === original.slug), expected)) throw new Error(`Unexpected Journey mutation: ${original.slug}`);
  }
  const afterCounts = { total: after.length, published: after.filter((record) => record.status === 'published').length, draft: after.filter((record) => record.status === 'draft').length };
  if (!isDeepStrictEqual(afterCounts, counts)) throw new Error('Preparation changed Journey publication counts');
  if (!isDeepStrictEqual(draftSlugs.sort(), after.filter((record) => record.status === 'draft').map((record) => record.slug).sort())) throw new Error('Preparation changed the draft slug set');
  console.log(JSON.stringify({
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    updated: execute ? eligible.length : 0,
    refused: refused.length,
    counts: afterCounts,
    publicationStatusesUnchanged: true,
    protectedJourneysUnchanged: true,
    idempotency: decisions.map((decision) => ({ slug: decision.slug, wouldUpdate: decision.action === 'UPDATE' ? 1 : 0, alreadyCorrect: decision.action === 'ALREADY_CORRECT' ? 1 : 0, refused: decision.action === 'REFUSED' ? 1 : 0 }))
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Phase 12 preparation failed');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}