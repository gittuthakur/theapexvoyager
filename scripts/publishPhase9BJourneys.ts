/** Phase 9B: exact two-Journey publication. Dry-run default; only status is persisted. */
import mongoose from 'mongoose';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { draftJourneys } from '../config/draftJourneys.config';
import { commercialValues } from './preparePhase9ACommercialData';
import type { PackageItineraryDay } from '../types/package';

export const PUBLICATION_SLUGS = Object.freeze(['dharamshala-mcleodganj-short-escape', 'grand-himachal-circuit']);
export function publicationUpdate(slug: string) {
  if (!PUBLICATION_SLUGS.includes(slug)) throw new Error(`Unknown publication slug: ${slug}`);
  return { $set: { status: 'published' as const } };
}
export async function validatePublishedDocument(record: Parameters<typeof Journey.hydrate>[0]) {
  const document = Journey.hydrate(record);
  document.status = 'published';
  // Runs the real document pre-validate hook, unlike query update validators alone.
  await document.validate();
}
const site = 'https://www.theapexvoyager.in';
async function page(path: string) {
  const r = await fetch(site + path, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const text = await r.text();
  if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${path}`);
  return text;
}
async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => !['--execute', '--deployment-ready'].includes(a))) throw new Error('Unknown argument; exact two-slug allowlist only');
  const execute = args.includes('--execute');
  if (execute && !args.includes('--deployment-ready')) throw new Error('Vercel Ready verification required');
  try { process.loadEnvFile('.env.local'); } catch { /* Supplied environment supported. */ }
  await connectDB();
  const before = await Journey.find().sort({ slug: 1 }).lean();
  const destinations = await Destination.find().sort({ slug: 1 }).lean();
  const regions = await Region.find().sort({ slug: 1 }).lean();
  const originalLive = before.filter(j => j.status === 'published' && !PUBLICATION_SLUGS.includes(j.slug));
  if (before.length !== 40 || originalLive.length !== 24) throw new Error('Unexpected global baseline');
  for (const path of ['/', '/journeys', '/destinations', '/destinations/mcleod-ganj', '/regions/himachal-pradesh', '/sitemap.xml', '/cancellation-policy', ...originalLive.map(j => `/journeys/${j.slug}`)]) {
    const html = await page(path);
    if (path === '/cancellation-policy' && !/journeys/i.test(html)) throw new Error('Cancellation applicability missing');
    console.log(JSON.stringify({ smoke: path, http: 200 }));
  }
  const refused: { slug: string; reason: string }[] = [];
  const eligible: typeof before = [];
  let alreadyPublished = 0;
  for (const slug of PUBLICATION_SLUGS) {
    try {
      publicationUpdate(slug);
      const record = before.find(j => j.slug === slug);
      const config = draftJourneys.find(j => j.slug === slug);
      if (!record || !config) throw new Error('Missing record/config');
      if (!['draft', 'published'].includes(record.status)) throw new Error('Unexpected status');
      const imageSource = slug === 'dharamshala-mcleodganj-short-escape' ? 'mcleod-ganj' : 'dalhousie';
      const expectedImage = destinations.find(d => d.slug === imageSource)?.image;
      if (!expectedImage || expectedImage !== `/images/destination-${imageSource}.jpg`) throw new Error('Source image differs from owner-approved path');
      const expected = commercialValues(slug, expectedImage);
      if (record.startingCity !== config.startingCity || (slug === 'grand-himachal-circuit' && record.endingCity !== 'Dalhousie')) throw new Error('Gateway drift');
      for (const [key, value] of Object.entries(expected)) {
        if (!isDeepStrictEqual(Reflect.get(record, key), value)) throw new Error(`Approved field differs: ${key}`);
      }
      const days = record.itinerary.map((d: PackageItineraryDay) => ({ day: d.day, title: d.title, description: d.description }));
      if (!isDeepStrictEqual(days, config.itinerary) || record.duration !== config.duration || !isDeepStrictEqual(record.destinationSlugs, config.destinationSlugs)) throw new Error('Route/duration drift');
      const duration = /^(\d+) Nights \/ (\d+) Days$/.exec(record.duration);
      if (!duration || +duration[2] !== days.length || +duration[1] !== days.length - 1) throw new Error('Duration mismatch');
      const blockers = getCommercialBlockers(record);
      if (!isDeepStrictEqual(blockers, record.status === 'draft' ? ['OWNER_APPROVAL_REQUIRED'] : [])) throw new Error(blockers.join(', '));
      if (record.minTravellers !== 2 || record.roomsIncluded !== 1) throw new Error('Occupancy mismatch');
      const region = regions.find(r => String(r._id) === String(record.regionId));
      if (!region || region.status !== 'published') throw new Error('Region not published');
      const stops = record.destinationSlugs.map((s: string) => destinations.find(d => d.slug === s));
      if (!stops.length || stops.some((d: (typeof destinations)[number] | undefined) => !d || d.status !== 'published' || String(d.regionId) !== String(record.regionId))) throw new Error('Invalid destination/region relationship');
      const source = destinations.find(d => record.destinationSlugs.includes(d.slug) && d.image === record.image);
      if (!source || !record.image?.startsWith('/images/destination-') || !existsSync(join('public', record.image))) throw new Error('Unverified image');
      const image = await fetch(site + record.image, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
      if (image.status !== 200 || !image.headers.get('content-type')?.startsWith('image/') || !(await image.arrayBuffer()).byteLength) throw new Error('Broken image');
      await validatePublishedDocument(record);
      console.log(JSON.stringify({ slug, status: record.status, price: record.price, duration: record.duration, image: record.image, imageSource: source.slug, region: region.name, blockers: getCommercialBlockers(record), documentValidation: 'PASS' }));
      if (record.status === 'published') alreadyPublished++; else eligible.push(record);
    } catch (error) {
      refused.push({ slug, reason: error instanceof Error ? error.message : 'Unknown validation failure' });
    }
  }
  console.log(JSON.stringify({ mode: execute ? 'EXECUTE' : 'DRY RUN', wouldPublish: eligible.length, alreadyPublished, refused }));
  if (refused.length) throw new Error('Publication gate refused targets; no writes performed');
  // Read-only snapshot contains catalogue content only, never credentials.
  const snapshotPath = join(tmpdir(), 'phase9b-publication-before.json');
  if (execute) {
    writeFileSync(snapshotPath, JSON.stringify({ journeys: before, destinations, regions }, null, 2));
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const record of eligible) {
          const current = await Journey.findById(record._id).session(session).lean();
          if (!isDeepStrictEqual(current, record)) throw new Error(`Concurrent edit: ${record.slug}`);
          // Validation above ran against this exact record as a published document.
          // Native single-field update avoids timestamps, defaults, or incidental saves.
          const result = await Journey.collection.updateOne({ _id: record._id, slug: record.slug, status: 'draft' }, publicationUpdate(record.slug), { session });
          if (result.modifiedCount !== 1) throw new Error(`Publication conflict: ${record.slug}`);
        }
      });
    } finally { await session.endSession(); }
  }
  const after = await Journey.find().sort({ slug: 1 }).lean();
  for (const original of before) {
    const expected = execute && PUBLICATION_SLUGS.includes(original.slug) ? { ...original, status: 'published' } : original;
    if (!isDeepStrictEqual(after.find(j => j.slug === original.slug), expected)) throw new Error(`Unexpected document mutation: ${original.slug}`);
  }
  if (!isDeepStrictEqual(destinations, await Destination.find().sort({ slug: 1 }).lean()) || !isDeepStrictEqual(regions, await Region.find().sort({ slug: 1 }).lean())) throw new Error('Destination/Region mutation detected');
  const counts = { total: after.length, published: after.filter(j => j.status === 'published').length, draft: after.filter(j => j.status === 'draft').length };
  if (execute && !isDeepStrictEqual(counts, { total: 40, published: 26, draft: 14 })) throw new Error('Post-publication count mismatch');
  writeFileSync(join(tmpdir(), 'phase9b-catalogue.json'), JSON.stringify({ journeys: after, destinations, regions }, null, 2));
  const report = { checkedAt: new Date().toISOString(), mode: execute ? 'EXECUTE' : 'DRY RUN', wouldPublish: eligible.length, published: execute ? eligible.length : 0, skipped: alreadyPublished, refused: 0, counts, statusOnly: true, nonTargetsUnchanged: true, destinationsAndRegionsUnchanged: true };
  writeFileSync(join(tmpdir(), execute ? 'phase9b-execution.json' : 'phase9b-dry-run.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') : 'Publication failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}
