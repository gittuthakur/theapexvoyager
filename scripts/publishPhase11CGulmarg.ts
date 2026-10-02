/** Phase 11C: publish exactly the owner-approved Gulmarg Journey; status only. */
import mongoose from 'mongoose';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { Journey } from '../models/Journey';
import { connectDB } from '../lib/mongodb';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { GULMARG_WINTER_IMAGE, getJourneyImageCredit } from '../config/imageCredits.config';

export const TARGET = 'gulmarg-winter-escape';
export const PUBLICATION_SLUGS = Object.freeze([TARGET]);

export function publicationUpdate(slug: string) {
  if (!PUBLICATION_SLUGS.includes(slug)) throw new Error(`Unknown publication slug: ${slug}`);
  return { $set: { status: 'published' as const } };
}

export function validatePublicationTarget(record: Record<string, unknown>) {
  if (record.slug !== TARGET) throw new Error('Only the exact Gulmarg Journey is authorized');
  if (record.status !== 'draft' && record.status !== 'published') throw new Error('Unexpected Journey status');
  if (record.duration !== '3 Nights / 4 Days' || record.price !== 19999) throw new Error('Approved duration/price changed');
  if (record.startingCity !== 'Srinagar' || record.endingCity !== 'Srinagar') throw new Error('Approved gateways changed');
  if (record.minTravellers !== 2 || record.roomsIncluded !== 1) throw new Error('Approved occupancy changed');
  if (!String(record.hotelCategoryDescription).includes('3 nights') || !String(record.hotelCategoryDescription).includes('double sharing')) {
    throw new Error('Approved accommodation basis changed');
  }
  if (!String(record.pickupInfo).includes('Srinagar Airport') || !String(record.dropInfo).includes('Srinagar Airport')) {
    throw new Error('Approved airport pickup/drop changed');
  }
  if (!String(record.mealPlan).includes('3 breakfasts') || !String(record.mealPlan).includes('3 dinners')) {
    throw new Error('Approved meal plan changed');
  }
  if (!String(record.transportType).includes('Srinagar Airport to Gulmarg') || !String(record.transportType).includes('Gulmarg back to Srinagar Airport')) {
    throw new Error('Approved road transfers changed');
  }
  if (!Array.isArray(record.inclusions) || record.inclusions.length === 0 || !Array.isArray(record.exclusions) || record.exclusions.length === 0) {
    throw new Error('Approved inclusions/exclusions are missing');
  }
  const exclusions = (record.exclusions as unknown[]).map(String).join(' ').toLowerCase();
  for (const term of ['gondola tickets', 'skiing', 'snowboarding', 'equipment', 'instructors', 'sledging', 'snowmobile', 'local snow vehicles']) {
    if (!exclusions.includes(term)) throw new Error(`Required exclusion missing: ${term}`);
  }
  if (record.image !== GULMARG_WINTER_IMAGE || !getJourneyImageCredit(String(record.image))) throw new Error('Verified winter image/credit changed');
  if (record.usesGeneralCancellationPolicy !== true) throw new Error('Approved cancellation policy changed');

  const itinerary = record.itinerary as Array<{ day: number; description: string }>;
  if (!Array.isArray(itinerary) || itinerary.length !== 4) throw new Error('Approved itinerary changed');
  const day2 = itinerary.find((day) => day.day === 2)?.description.toLowerCase() ?? '';
  for (const term of ['optional', 'separately payable', 'operations', 'weather', 'availability', 'applicable local rules']) {
    if (!day2.includes(term)) throw new Error(`Day 2 Gondola protection missing: ${term}`);
  }
  if (/included|guaranteed/.test(day2)) throw new Error('Day 2 implies inclusion or guaranteed operation');

  const day3 = itinerary.find((day) => day.day === 3)?.description.toLowerCase() ?? '';
  for (const term of ['skiing', 'snowboarding', 'sledging', 'snowmobile', 'optional', 'separately payable', 'written quotation', 'itinerary changes', 'snowfall', 'not guaranteed', 'uninterrupted access']) {
    if (!day3.includes(term)) throw new Error(`Day 3 winter protection missing: ${term}`);
  }

  const blockers = getCommercialBlockers(record as Parameters<typeof getCommercialBlockers>[0]);
  const expectedBlockers = record.status === 'draft' ? ['OWNER_APPROVAL_REQUIRED'] : [];
  if (!isDeepStrictEqual(blockers, expectedBlockers)) throw new Error(`Unexpected readiness blockers: ${blockers.join(', ')}`);
  return { blockers, image: record.image, inclusionsCount: (record.inclusions as unknown[]).length, exclusionsCount: (record.exclusions as unknown[]).length };
}

export function publishedRecord(record: Record<string, unknown>) {
  validatePublicationTarget(record);
  return { ...record, status: 'published' };
}

async function request(path: string) {
  return fetch(`https://www.theapexvoyager.in${path}`, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
}

async function verifyProductionSurface(rows: Array<Record<string, unknown>>, status: 'draft' | 'published') {
  const expectedPublished = status === 'draft' ? 27 : 28;
  const expectedSitemap = expectedPublished;
  const [imageResponse, creditsResponse, pageResponse, catalogueResponse, sitemapResponse] = await Promise.all([
    request(GULMARG_WINTER_IMAGE),
    request('/photo-credits'),
    request(`/journeys/${TARGET}`),
    request('/api/journeys'),
    request('/sitemap.xml')
  ]);
  const [imageBytes, credits, pageHtml, catalogueData, sitemap] = await Promise.all([
    imageResponse.arrayBuffer(), creditsResponse.text(), pageResponse.text(), catalogueResponse.json(), sitemapResponse.text()
  ]);
  const credit = getJourneyImageCredit(GULMARG_WINTER_IMAGE)!;
  if (imageResponse.status !== 200 || !imageResponse.headers.get('content-type')?.startsWith('image/') || imageBytes.byteLength === 0) {
    throw new Error('Production winter image is unavailable');
  }
  if (creditsResponse.status !== 200 || !credits.includes(credit.title) || !credits.includes(credit.author) || !credits.includes(credit.licenseName) || !credits.includes(credit.sourceUrl)) {
    throw new Error('Public image credit verification failed');
  }
  if (status === 'draft' && pageResponse.status !== 404) throw new Error('Draft Journey URL is not a genuine 404');
  if (status === 'published' && pageResponse.status !== 200) throw new Error('Published Journey URL is not HTTP 200');
  const catalogueRows = Array.isArray(catalogueData.journeys) ? catalogueData.journeys as Array<{ slug: string }> : [];
  const catalogueOccurrences = catalogueRows.filter((journey) => journey.slug === TARGET).length;
  if (catalogueResponse.status !== 200 || catalogueRows.length !== expectedPublished || catalogueOccurrences !== (status === 'published' ? 1 : 0)) {
    throw new Error('Public Journey catalogue count or target membership mismatch');
  }
  const journeyUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).filter((url) => url.includes('/journeys/'));
  const sitemapOccurrences = journeyUrls.filter((url) => url.endsWith(`/journeys/${TARGET}`)).length;
  if (sitemapResponse.status !== 200 || journeyUrls.length !== expectedSitemap || sitemapOccurrences !== (status === 'published' ? 1 : 0)) {
    throw new Error('Journey sitemap count or target membership mismatch');
  }
  if (status === 'published') {
    for (const marker of ['Gulmarg Winter Escape', '3 Nights / 4 Days', 'Starting From ₹19,999 per person', 'Srinagar Airport', 'Photo credit', 'Koshur']) {
      if (!pageHtml.includes(marker)) throw new Error(`Published page missing visible content: ${marker}`);
    }
  }
  const draftRows = rows.filter((row) => row.status === 'draft');
  if (status === 'published' && draftRows.some((row) => row.slug === TARGET)) throw new Error('Target remained in draft snapshot');
  for (const row of draftRows) {
    if (row.slug === TARGET) continue;
    const draftResponse = await request(`/journeys/${String(row.slug)}`);
    if (draftResponse.status !== 404) throw new Error(`Remaining draft leaked publicly: ${String(row.slug)}`);
    if (catalogueRows.some((journey) => journey.slug === row.slug)) throw new Error(`Remaining draft in catalogue: ${String(row.slug)}`);
    if (journeyUrls.some((url) => url.endsWith(`/journeys/${String(row.slug)}`))) throw new Error(`Remaining draft in sitemap: ${String(row.slug)}`);
  }
  return { imageHttp: imageResponse.status, creditsHttp: creditsResponse.status, pageHttp: pageResponse.status, catalogueCount: catalogueRows.length, catalogueOccurrences, sitemapCount: journeyUrls.length, sitemapOccurrences, remainingDraftsIsolated: true };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--execute', '--owner-approved', '--deployment-ready'].includes(arg))) {
    throw new Error('Only --execute, --owner-approved, and --deployment-ready are supported');
  }
  const execute = args.includes('--execute');
  if (execute && (!args.includes('--owner-approved') || !args.includes('--deployment-ready'))) {
    throw new Error('Execution requires explicit owner approval and verified Ready deployment');
  }
  try { process.loadEnvFile('.env.local'); } catch { /* Supplied environment supported. */ }
  await connectDB();

  const before = await Journey.find().sort({ slug: 1 }).lean();
  const counts = (rows: typeof before) => ({
    total: rows.length,
    published: rows.filter((row) => row.status === 'published').length,
    draft: rows.filter((row) => row.status === 'draft').length
  });
  const target = before.find((row) => row.slug === TARGET);
  if (!target) throw new Error('Authorized Gulmarg Journey is missing');
  const beforeCounts = counts(before);
  if (target.status === 'draft' && !isDeepStrictEqual(beforeCounts, { total: 40, published: 27, draft: 13 })) throw new Error('Unexpected pre-publication counts');
  if (target.status === 'published' && !isDeepStrictEqual(beforeCounts, { total: 40, published: 28, draft: 12 })) throw new Error('Unexpected post-publication counts');
  const targetReadiness = validatePublicationTarget(target);
  const candidate = publishedRecord(target);
  const candidateDocument = Journey.hydrate(candidate);
  await candidateDocument.validate();

  const localImage = resolve('public', GULMARG_WINTER_IMAGE.slice(1));
  if (!existsSync(localImage)) throw new Error('Verified local image asset is missing');
  const imageCredit = getJourneyImageCredit(GULMARG_WINTER_IMAGE);
  if (!imageCredit?.sourceUrl || !imageCredit.licenseUrl || !imageCredit.author) throw new Error('Image credit metadata is incomplete');

  const expectedStatus = target.status === 'published' ? 'published' : 'draft';
  const productionSurface = await verifyProductionSurface(before as Array<Record<string, unknown>>, expectedStatus);
  const eligible = target.status === 'draft' ? [target] : [];
  const alreadyPublished = target.status === 'published' ? 1 : 0;
  const summary = {
    target: TARGET,
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    targetCount: 1,
    wouldPublish: eligible.length,
    alreadyPublished,
    refused: 0,
    protectedFieldsUnchanged: true,
    changedFields: execute && eligible.length ? ['status'] : [],
    beforeCounts,
    targetStatus: target.status,
    readinessBlockers: targetReadiness.blockers,
    productionSurface
  };
  console.log(JSON.stringify(summary));

  if (execute && eligible.length) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await Journey.findById(target._id).session(session).lean();
        if (!isDeepStrictEqual(current, target)) throw new Error('Concurrent target edit detected');
        const result = await Journey.collection.updateOne(
          { _id: target._id, slug: TARGET, status: 'draft' },
          publicationUpdate(TARGET),
          { session }
        );
        if (result.modifiedCount !== 1) throw new Error('Publication conflict');
      });
    } finally {
      await session.endSession();
    }
  }

  const after = await Journey.find().sort({ slug: 1 }).lean();
  for (const original of before) {
    const expected = original.slug === TARGET && execute && eligible.length ? { ...original, status: 'published' } : original;
    if (!isDeepStrictEqual(after.find((row) => row.slug === original.slug), expected)) throw new Error(`Unexpected Journey mutation: ${original.slug}`);
  }
  const afterCounts = counts(after);
  const expectedCounts = execute && eligible.length ? { total: 40, published: 28, draft: 12 } : beforeCounts;
  if (!isDeepStrictEqual(afterCounts, expectedCounts)) throw new Error('Unexpected post-publication counts');
  const afterTarget = after.find((row) => row.slug === TARGET)!;
  const finalSurface = await verifyProductionSurface(after as Array<Record<string, unknown>>, afterTarget.status as 'draft' | 'published');
  console.log(JSON.stringify({
    mode: execute ? 'EXECUTE' : 'DRY RUN',
    published: execute ? eligible.length : 0,
    skipped: alreadyPublished,
    refused: 0,
    counts: afterCounts,
    targetStatus: afterTarget.status,
    onlyStatusChanged: true,
    nonTargetsUnchanged: true,
    finalSurface
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Publication failed');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}